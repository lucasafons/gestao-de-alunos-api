import request from 'supertest';
import app from '../../src/app.js';

export async function loginAsAdmin() {
  return request(app).post('/api/auth/login').send({
    email: 'admin@escola.com',
    senha: 'admin123',
  });
}

export async function loginAsUser({ email, senha }) {
  return request(app).post('/api/auth/login').send({ email, senha });
}
