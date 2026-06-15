import { FastifyInstance } from 'fastify';
import { deleteUserPhone, getCurrentUserProfile, saveUserPhone, updateMyProfile } from './users.controller.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get('/me', getCurrentUserProfile);
  // PATCH /users/me — fullName va/yoki phoneNumber yangilash (customer profil)
  fastify.patch('/me', updateMyProfile);
  // PATCH /users/me/phone — save / update caller's phone number
  fastify.patch('/me/phone', saveUserPhone);
  fastify.delete('/me/phone', deleteUserPhone);
}
