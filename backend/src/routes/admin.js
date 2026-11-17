const { Router } = require('express');
const { requireAdmin, requireRole } = require('../middleware/auth');
const { makeCrudController } = require('../controllers/adminCrudController');

const router = Router();
router.use(requireAdmin);

const resources = {
  services: makeCrudController({
    table: 'services',
    fields: ['title_en', 'title_ar', 'description_en', 'description_ar', 'icon', 'price_cents', 'deposit_cents', 'sort_order'],
    orderBy: 'sort_order ASC'
  }),
  doctors: makeCrudController({
    table: 'doctors',
    fields: [
      'slug', 'name_en', 'name_ar', 'title_en', 'title_ar', 'bio_en', 'bio_ar',
      'photo_url', 'location_id', 'sort_order'
    ],
    orderBy: 'sort_order ASC'
  }),
  locations: makeCrudController({
    table: 'locations',
    fields: [
      'slug', 'city_en', 'city_ar', 'country_en', 'country_ar',
      'address_en', 'address_ar', 'phone', 'email', 'hours_en', 'hours_ar',
      'latitude', 'longitude', 'timezone'
    ],
    orderBy: 'id ASC'
  }),
  testimonials: makeCrudController({
    table: 'testimonials',
    fields: ['quote_en', 'quote_ar', 'patient_name', 'location_id', 'rating', 'is_published'],
    hasUpdatedAt: false,
    orderBy: 'created_at DESC'
  }),
  closures: makeCrudController({
    table: 'clinic_closures',
    fields: ['location_id', 'closure_date', 'reason'],
    hasUpdatedAt: false,
    orderBy: 'closure_date ASC'
  })
};

for (const [name, controller] of Object.entries(resources)) {
  router.get(`/${name}`, controller.list);
  router.get(`/${name}/:id`, controller.get);
  router.post(`/${name}`, controller.create);
  router.put(`/${name}/:id`, controller.update);
  // Deleting content is a step above simple edits — require manager or above.
  router.delete(`/${name}/:id`, requireRole('manager'), controller.remove);
}

module.exports = router;
