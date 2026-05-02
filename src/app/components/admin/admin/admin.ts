import {
  inject,
  Component,
  signal,
  WritableSignal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AdminService} from '../../../services/adminService';
import {ConfirmModalComponent} from '../../shared/confirm-modal/confirm-modal';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {Chart, registerables} from 'chart.js';
import {interval, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, FormsModule, ConfirmModalComponent, LoadingSpinner],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly adminService: AdminService = inject(AdminService);

  activeTab: 'dashboard' | 'users' = 'dashboard';

  stats: any = null;
  loadingStats: WritableSignal<boolean> = signal<boolean>(true);
  loadingCharts: WritableSignal<boolean> = signal<boolean>(false);
  chartPeriod: string = 'week';
  private destroy$ = new Subject<void>();

  private usersChart: Chart | null = null;
  private publicationsChart: Chart | null = null;
  private activityChart: Chart | null = null;
  private hashtagsChart: Chart | null = null;

  users: WritableSignal<any[]> = signal<any[]>([]);
  loadingUsers: WritableSignal<boolean> = signal<boolean>(false);
  page: number = 1;
  totalPages: number = 1;
  search: string = '';
  searchInput: string = '';

  selectedUser: any = null;
  selectedUserStats: any = null;
  loadingUserStats: WritableSignal<boolean> = signal<boolean>(false);
  showUserPanel: WritableSignal<boolean> = signal<boolean>(false);

  showDeleteModal: WritableSignal<boolean> = signal<boolean>(false);
  userToDelete: string = '';

  readonly roles = [
    {value: 'ROLE_USER', label: 'Usuario'},
    {value: 'ROLE_VERIFIED', label: 'Verificado'},
    {value: 'ROLE_ADMIN', label: 'Admin'}
  ];

  readonly periods = [
    {value: 'day', label: 'Últimos 30 días'},
    {value: 'week', label: 'Últimas 12 semanas'},
    {value: 'month', label: 'Último año'}
  ];

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadCharts();
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.activeTab === 'dashboard') {
        this.loadStats();
        this.loadCharts();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private destroyCharts(): void {
    this.usersChart?.destroy();
    this.publicationsChart?.destroy();
    this.activityChart?.destroy();
    this.hashtagsChart?.destroy();
  }

  setTab(tab: 'dashboard' | 'users'): void {
    this.activeTab = tab;
    if (tab === 'dashboard') {
      this.loadStats();
      this.loadCharts();
    }
  }

  setPeriod(period: string): void {
    this.chartPeriod = period;
    this.loadCharts();
  }

  loadStats(): void {
    this.loadingStats.set(true);
    this.adminService.getStats().subscribe({
      next: (response: any) => {
        this.stats = response.stats;
        this.loadingStats.set(false);
      },
      error: () => {
        this.loadingStats.set(false);
      }
    });
  }

  loadCharts(): void {
    this.loadingCharts.set(true);
    this.adminService.getChartData(this.chartPeriod).subscribe({
      next: (response: any) => {
        this.loadingCharts.set(false);
        setTimeout(() => this.renderCharts(response), 300);
      },
      error: () => { this.loadingCharts.set(false); }
    });
  }

  private renderCharts(data?: any): void {
    if (!data) return;
    this.destroyCharts();

    const primary = '#c4636d';
    const primaryLight = 'rgba(196, 99, 109, 0.15)';
    const secondary = '#8b9dc3';
    const secondaryLight = 'rgba(139, 157, 195, 0.15)';
    const gridColor = 'rgba(0,0,0,0.06)';
    const font = 'Inter, Arial, sans-serif';

    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {display: false},
        tooltip: {
          backgroundColor: '#1a1a1a',
          titleFont: {family: font, size: 12},
          bodyFont: {family: font, size: 12},
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          grid: {color: gridColor},
          ticks: {font: {family: font, size: 11}, color: '#8a8480'}
        },
        y: {
          grid: {color: gridColor},
          ticks: {font: {family: font, size: 11}, color: '#8a8480', precision: 0},
          beginAtZero: true
        }
      }
    };

    const formatLabel = (label: string): string => {
      if (!label) return '';
      // formato día: 2026-04-24
      if (label.length === 10) {
        const [y, m, d] = label.split('-');
        return `${d}/${m}/${y}`;
      }
      // formato semana: 2026-16 o mes: 2026-04
      if (label.length === 7 && label.includes('-')) {
        const [y, suffix] = label.split('-');
        const num = parseInt(suffix);
        // si ell número es <= 12 es un mes, si no es una sem
        if (num <= 12) {
          return `${suffix}/${y}`;
        } else {
          return `Sem ${num}/${y}`;
        }
      }
      return label;
    };

    // usuarios
    const usersCanvas = document.getElementById('usersChart') as HTMLCanvasElement;
    if (usersCanvas) {
      this.usersChart = new Chart(usersCanvas, {
        type: 'line',
        data: {
          labels: data.users.map((d: any) => formatLabel(d._id)),
          datasets: [{
            data: data.users.map((d: any) => d.count),
            borderColor: primary,
            backgroundColor: primaryLight,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: primary,
            pointRadius: 4
          }]
        },
        options: {...baseOptions}
      });
    }

    // Grafica publicaciones
    const pubCanvas = document.getElementById('publicationsChart') as HTMLCanvasElement;
    if (pubCanvas) {
      this.publicationsChart = new Chart(pubCanvas, {
        type: 'bar',
        data: {
          labels: data.publications.map((d: any) => formatLabel(d._id)),
          datasets: [{
            data: data.publications.map((d: any) => d.count),
            backgroundColor: primaryLight,
            borderColor: primary,
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {...baseOptions}
      });
    }

    // gráfica actividad x día de la semana
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const activityData = Array(7).fill(0);
    data.activityByDay.forEach((d: any) => {
      activityData[d._id - 1] = d.count;
    });

    const actCanvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (actCanvas) {
      this.activityChart = new Chart(actCanvas, {
        type: 'bar',
        data: {
          labels: days,
          datasets: [{
            data: activityData,
            backgroundColor: activityData.map(v =>
              v === Math.max(...activityData) ? primary : primaryLight
            ),
            borderColor: primary,
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {...baseOptions}
      });
    }

    // grafica #
    const hashCanvas = document.getElementById('hashtagsChart') as HTMLCanvasElement;
    if (hashCanvas) {
      this.hashtagsChart = new Chart(hashCanvas, {
        type: 'doughnut',
        data: {
          labels: data.topHashtags.map((d: any) => `#${d._id}`),
          datasets: [{
            data: data.topHashtags.map((d: any) => d.count),
            backgroundColor: [
              '#c4636d', '#d4838c', '#e0a0a8', '#8b9dc3', '#a0b0d0',
              '#6b8cb8', '#b8c4d8', '#e8b4b8', '#f0c8cc', '#c8d4e8'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                font: {family: font, size: 11},
                color: '#4a4a4a',
                padding: 12,
                usePointStyle: true
              }
            },
            tooltip: {
              backgroundColor: '#1a1a1a',
              titleFont: {family: font, size: 12},
              bodyFont: {family: font, size: 12},
              padding: 10,
              cornerRadius: 8
            }
          }
        }
      });
    }
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.adminService.getUsers(this.page, this.search).subscribe({
      next: (response: any) => {
        this.users.set(response.users);
        this.totalPages = response.totalPages;
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
      }
    });
  }

  onSearch(): void {
    this.search = this.searchInput;
    this.page = 1;
    this.loadUsers();
  }

  clearSearch(): void {
    this.search = '';
    this.searchInput = '';
    this.page = 1;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  openUserPanel(user: any): void {
    this.selectedUser = user;
    this.selectedUserStats = null;
    this.showUserPanel.set(true);
    this.loadingUserStats.set(true);

    this.adminService.getUserStats(user._id).subscribe({
      next: (response: any) => {
        this.selectedUserStats = response.stats;
        this.loadingUserStats.set(false);
      },
      error: () => {
        this.loadingUserStats.set(false);
      }
    });
  }

  closeUserPanel(): void {
    this.showUserPanel.set(false);
    this.selectedUser = null;
    this.selectedUserStats = null;
  }

  updateRole(userId: string, role: string): void {
    this.adminService.updateRole(userId, role).subscribe({
      next: () => {
        this.users.update(current =>
          current.map(u => u._id === userId ? {...u, role} : u)
        );
        if (this.selectedUser?._id === userId) {
          this.selectedUser = {...this.selectedUser, role};
        }
      },
      error: () => {
      }
    });
  }

  confirmDelete(userId: string): void {
    this.userToDelete = userId;
    this.showDeleteModal.set(true);
  }

  deleteUser(): void {
    this.showDeleteModal.set(false);
    this.adminService.deleteUser(this.userToDelete).subscribe({
      next: () => {
        this.users.update(current => current.filter(u => u._id !== this.userToDelete));
        if (this.selectedUser?._id === this.userToDelete) {
          this.closeUserPanel();
        }
        this.loadStats();
        this.loadCharts();
      },
      error: () => {
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.roles.find(r => r.value === role)?.label ?? role;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    return num?.toString() ?? '0';
  }
}
