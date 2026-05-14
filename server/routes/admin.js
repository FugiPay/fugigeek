const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats, getUsers, updateUser, deleteUser, createAdmin, purgeUser,
  getTasks, updateTask, deleteTask,
  getOrders, resolveOrder,
  getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/adminController');

const staff = authorize('admin', 'manager');

router.use(protect);

router.get( '/stats',                   staff,              getStats);

router.get( '/users',                   staff,              getUsers);
router.put( '/users/:id',               staff,              updateUser);
router.delete('/users/:id',             staff,              deleteUser);
router.delete('/users/:id/purge',       authorize('admin'), purgeUser);
router.post('/users/create-admin',      authorize('admin'), createAdmin);

router.get( '/tasks',                   staff,              getTasks);
router.put( '/tasks/:id',               staff,              updateTask);
router.delete('/tasks/:id',             staff,              deleteTask);

router.get( '/orders',                  staff,              getOrders);
router.put( '/orders/:id/resolve',      staff,              resolveOrder);

router.get(   '/categories',            staff,              getCategories);
router.post(  '/categories',            staff,              createCategory);
router.put(   '/categories/:id',        staff,              updateCategory);
router.delete('/categories/:id',        authorize('admin'), deleteCategory);

module.exports = router;
