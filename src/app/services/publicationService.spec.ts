import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicationService } from './publicationService';
import { environment } from '../../environments/environment';

describe('PublicationService', () => {
  let service: PublicationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/publication`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PublicationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(PublicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('savePublication debería hacer POST a la URL correcta', () => {
    const nuevaPublicacion = { title: 'Paella valenciana', ingredients: [] };

    service.savePublication(nuevaPublicacion).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/save`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevaPublicacion);
    req.flush({ status: true, publication: nuevaPublicacion });
  });

  it('getFeed debería hacer GET y transformar la respuesta correctamente', () => {
    const respuestaBackend = {
      publications: [{ _id: '1', title: 'Tortilla' }],
      totalPages: 3
    };

    service.getFeed(1).subscribe(resultado => {
      expect(resultado.publications).toEqual(respuestaBackend.publications);
      expect(resultado.totalPages).toBe(3);
    });

    const req = httpMock.expectOne(`${apiUrl}/feed/1`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaBackend);
  });

  it('deletePublication debería hacer DELETE a la URL correcta', () => {
    const id = 'abc123';

    service.deletePublication(id).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/remove/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ status: true });
  });

  it('getPublicationsByUser debería hacer GET y devolver el array de publicaciones', () => {
    const userId = 'user123';
    const respuestaBackend = {
      publications: [{ _id: '1', title: 'Gazpacho' }]
    };

    service.getPublicationsByUser(userId, 1).subscribe(resultado => {
      expect(resultado).toEqual(respuestaBackend.publications);
    });

    const req = httpMock.expectOne(`${apiUrl}/user/${userId}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaBackend);
  });

  it('getPublicationCounters sin userId debería hacer GET a /count', () => {
    service.getPublicationCounters().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ total: 5 });
  });

  it('getPublicationCounters con userId debería hacer GET a /count/:userId', () => {
    const userId = 'user123';

    service.getPublicationCounters(userId).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/count/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush({ total: 3 });
  });

  it('explore debería hacer GET con los parámetros correctos y transformar la respuesta', () => {
    const respuestaBackend = {
      publications: [{ _id: '1', title: 'Croquetas' }],
      totalPages: 2
    };

    service.explore(1, 'recent', 'postre', 'arroz').subscribe(resultado => {
      expect(resultado.publications).toEqual(respuestaBackend.publications);
      expect(resultado.totalPages).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/explore?page=1&sort=recent&hashtag=postre&search=arroz`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaBackend);
  });

  it('getPublicationById debería hacer GET y devolver la publicación', () => {
    const id = 'pub123';
    const respuestaBackend = {
      publication: { _id: 'pub123', title: 'Paella' }
    };

    service.getPublicationById(id).subscribe(resultado => {
      expect(resultado).toEqual(respuestaBackend.publication);
    });

    const req = httpMock.expectOne(`${apiUrl}/detail/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaBackend);
  });

  it('updatePublication debería hacer PUT a la URL correcta con los datos', () => {
    const id = 'pub123';
    const datos = { title: 'Paella actualizada' };

    service.updatePublication(id, datos).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/update/${id}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(datos);
    req.flush({ status: true });
  });

  it('toggleLike debería hacer POST a la URL correcta', () => {
    const id = 'pub123';

    service.toggleLike(id).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/like/${id}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush({ status: true, hasLike: true, likes: 5 });
  });

});
