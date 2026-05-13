const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats, getUsers, updateUser, deleteUser, createAdmin,
  getTasks, updateTask, deleteTask,
  getOrders, resolveOrder,
  getCategories,
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

router.get( '/stats',                 getStats);

router.get( '/users',                 getUsers);
router.put( '/users/:id',             updateUser);
router.delete('/users/:id',           deleteUser);
router.post('/users/create-admin',    createAdmin);

router.get( '/tasks',                 getTasks);
router.put( '/tasks/:id',             updateTask);
router.delete('/tasks/:id',           deleteTask);

router.get( '/orders',                getOrders);
router.put( '/orders/:id/resolve',    resolveOrder);

router.get( '/categories',            getCategories);

module.exports = router;
