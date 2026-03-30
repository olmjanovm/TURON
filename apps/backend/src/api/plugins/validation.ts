import fp from 'fastify-plugin';
import { 
  validatorCompiler, 
  serializerCompiler, 
  ZodTypeProvider 
} from 'fastify-type-provider-zod';
import { FastifyInstance } from 'fastify';

export default fp(async function validationPlugin(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
});
