import fs from 'node:fs';
import { expect } from 'chai';
import request from 'supertest';
import app from '../../src/app.js';
import { loginAsAdmin, loginAsUser } from '../helpers/auth.js';

const fixtures = JSON.parse(
  fs.readFileSync(new URL('../data/scenarios.json', import.meta.url), 'utf8')
);

describe('Aluno workflow', function () {
  this.timeout(20000);

  let adminToken;
  let alunoToken;
  let alunoCriado;

  it('deve logar como administrador usando dados do arquivo JSON', async () => {
    const response = await request(app).post('/api/auth/login').send(fixtures.adminLogin);

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
    expect(response.body.usuario.role).to.equal('admin');
    adminToken = response.body.token;
  });

  it('deve cadastrar um aluno autenticado como admin', async () => {
    const payload = {
      ...fixtures.studentCreate,
      email: `${Date.now()}-${fixtures.studentCreate.email}`,
      matricula: `${Date.now()}`,
    };

    const response = await request(app)
      .post('/api/admin/alunos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('id');
    expect(response.body.email).to.equal(payload.email);
    alunoCriado = response.body;
  });

  it('deve logar como aluno criado', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: alunoCriado.email,
      senha: fixtures.studentCreate.senha,
    });

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token');
    expect(response.body.usuario.role).to.equal('aluno');
    alunoToken = response.body.token;
  });

  it('deve matricular o aluno na disciplina antes de registrar a entrega', async () => {
    const response = await request(app)
      .post(`/api/admin/disciplinas/${fixtures.studentWork.disciplinaId}/matriculas`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ alunoId: alunoCriado.id });

    expect(response.status).to.equal(201);
    expect(response.body.alunoId).to.equal(alunoCriado.id);
  });

  it('deve registrar entrega de trabalho como aluno', async () => {
    const payload = { ...fixtures.studentWork };

    const response = await request(app)
      .post(`/api/alunos/${alunoCriado.id}/trabalhos`)
      .set('Authorization', `Bearer ${alunoToken}`)
      .send(payload);

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('id');
    expect(response.body.titulo).to.equal(payload.titulo);
    expect(response.body.alunoId).to.equal(alunoCriado.id);
  });

  it('deve validar cenários em massa com Data-Driven Testing', async () => {
    for (const scenario of fixtures.loginScenarios) {
      const response = await request(app).post('/api/auth/login').send(scenario.credentials);
      expect(response.status).to.equal(scenario.expectedStatus);
      if (scenario.expectedToken) {
        expect(response.body).to.have.property('token');
      }
    }
  });

  it('deve reutilizar helpers de login do admin e do aluno', async () => {
    const adminResponse = await loginAsAdmin();
    const alunoResponse = await loginAsUser({
      email: alunoCriado.email,
      senha: fixtures.studentCreate.senha,
    });

    expect(adminResponse.status).to.equal(200);
    expect(alunoResponse.status).to.equal(200);
    expect(adminResponse.body.usuario.role).to.equal('admin');
    expect(alunoResponse.body.usuario.role).to.equal('aluno');
  });
});
