export const ADMIN_RESOURCES = {
  news: {
    label: 'News',
    singular: 'Article',
    listColumns: [
      { key: 'title_en', label: 'Title' },
      { key: 'is_published', label: 'Published', type: 'boolean' }
    ],
    fields: [
      { key: 'title_en', label: 'Title (English)', type: 'text', required: true },
      { key: 'title_ar', label: 'Title (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'excerpt_en', label: 'Excerpt (English)', type: 'textarea' },
      { key: 'excerpt_ar', label: 'Excerpt (Arabic)', type: 'textarea', dir: 'rtl' },
      { key: 'body_en', label: 'Body (English)', type: 'textarea', rows: 10, required: true },
      { key: 'body_ar', label: 'Body (Arabic)', type: 'textarea', rows: 10, required: true, dir: 'rtl' },
      { key: 'cover_image_url', label: 'Cover Image', type: 'image' },
      { key: 'is_published', label: 'Published', type: 'checkbox', default: true }
    ]
  },
  services: {
    label: 'Services',
    singular: 'Service',
    listColumns: [
      { key: 'title_en', label: 'Title' },
      { key: 'sort_order', label: 'Order' }
    ],
    fields: [
      { key: 'title_en', label: 'Title (English)', type: 'text', required: true },
      { key: 'title_ar', label: 'Title (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'description_en', label: 'Description (English)', type: 'textarea', required: true },
      { key: 'description_ar', label: 'Description (Arabic)', type: 'textarea', required: true, dir: 'rtl' },
      { key: 'price_cents', label: 'Price in cents (optional, e.g. 10000 = $100.00)', type: 'number' },
      { key: 'deposit_cents', label: 'Deposit in cents, collected via Stripe at booking (optional)', type: 'number' },
      { key: 'sort_order', label: 'Sort order (lower shows first)', type: 'number', default: 0 }
    ]
  },
  doctors: {
    label: 'Doctors',
    singular: 'Doctor',
    listColumns: [
      { key: 'name_en', label: 'Name' },
      { key: 'title_en', label: 'Title' }
    ],
    fields: [
      { key: 'slug', label: 'Slug (used in the doctor\u2019s profile URL, e.g. "dr-amir")', type: 'text' },
      { key: 'name_en', label: 'Name (English)', type: 'text', required: true },
      { key: 'name_ar', label: 'Name (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'title_en', label: 'Title (English)', type: 'text', required: true },
      { key: 'title_ar', label: 'Title (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'bio_en', label: 'Bio (English)', type: 'textarea' },
      { key: 'bio_ar', label: 'Bio (Arabic)', type: 'textarea', dir: 'rtl' },
      { key: 'photo_url', label: 'Photo', type: 'image' },
      { key: 'location_id', label: 'Location', type: 'location-select' },
      { key: 'sort_order', label: 'Sort order (lower shows first)', type: 'number', default: 0 }
    ]
  },
  locations: {
    label: 'Locations',
    singular: 'Location',
    listColumns: [
      { key: 'city_en', label: 'City' },
      { key: 'country_en', label: 'Country' }
    ],
    fields: [
      { key: 'slug', label: 'Slug (used in booking URLs, lowercase, no spaces)', type: 'text', required: true },
      { key: 'city_en', label: 'City (English)', type: 'text', required: true },
      { key: 'city_ar', label: 'City (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'country_en', label: 'Country (English)', type: 'text', required: true },
      { key: 'country_ar', label: 'Country (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'address_en', label: 'Address (English)', type: 'textarea', required: true },
      { key: 'address_ar', label: 'Address (Arabic)', type: 'textarea', required: true, dir: 'rtl' },
      { key: 'phone', label: 'Phone', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', required: true },
      { key: 'hours_en', label: 'Hours summary (English)', type: 'text', required: true },
      { key: 'hours_ar', label: 'Hours summary (Arabic)', type: 'text', required: true, dir: 'rtl' },
      { key: 'latitude', label: 'Latitude', type: 'number' },
      { key: 'longitude', label: 'Longitude', type: 'number' },
      { key: 'timezone', label: 'IANA timezone (e.g. "Africa/Cairo", "Asia/Dubai") \u2014 drives booking cutoff times', type: 'text', required: true, default: 'UTC' }
    ]
  },
  testimonials: {
    label: 'Testimonials',
    singular: 'Testimonial',
    listColumns: [
      { key: 'patient_name', label: 'Patient' },
      { key: 'is_published', label: 'Published', type: 'boolean' }
    ],
    fields: [
      { key: 'patient_name', label: 'Patient name or label (e.g. "Patient, Cairo")', type: 'text', required: true },
      { key: 'quote_en', label: 'Quote (English)', type: 'textarea', required: true },
      { key: 'quote_ar', label: 'Quote (Arabic)', type: 'textarea', required: true, dir: 'rtl' },
      { key: 'location_id', label: 'Location', type: 'location-select' },
      { key: 'rating', label: 'Rating (1\u20135)', type: 'number' },
      { key: 'is_published', label: 'Published', type: 'checkbox', default: true }
    ]
  },
  closures: {
    label: 'Closures',
    singular: 'Closure',
    listColumns: [
      { key: 'closure_date', label: 'Date' },
      { key: 'reason', label: 'Reason' }
    ],
    fields: [
      { key: 'location_id', label: 'Location', type: 'location-select', required: true },
      { key: 'closure_date', label: 'Date', type: 'date', required: true },
      { key: 'reason', label: 'Reason (e.g. "Public holiday")', type: 'text' }
    ]
  }
};
