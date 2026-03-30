import { FastifyInstance } from 'fastify';
import { 
  getAddresses, 
  handleCreateAddress, 
  handleDeleteAddress 
} from './addresses.controller';
import { 
  AddressSchema, 
  IdParamSchema 
} from '../../utils/schemas';

export default async function addressRoutes(fastify: FastifyInstance) {
  // All address routes require authentication (added in app.ts registration)
  fastify.get('/', getAddresses);
  
  fastify.post('/', {
    schema: { body: AddressSchema }
  }, handleCreateAddress);

  fastify.delete('/:id', {
    schema: { params: IdParamSchema }
  }, handleDeleteAddress);
}
