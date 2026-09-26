import 'dotenv/config';
import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/gestao-de-alunos';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

mongoose.connection.on('error', (err) => {
  console.error('Erro de conexão com o MongoDB:', err.message);
});

await mongoose.connect(MONGODB_URI);

console.log(`MongoDB conectado em ${MONGODB_URI}`);

export { MONGODB_URI };
export default mongoose;
