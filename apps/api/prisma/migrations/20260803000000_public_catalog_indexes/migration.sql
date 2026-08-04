-- Indexes supporting the public catalog filters and sort order.
CREATE INDEX "products_public_catalog_idx"
ON "products" ("is_active", "deleted_at", "sort_order", "created_at");

CREATE INDEX "products_public_category_catalog_idx"
ON "products" ("category_id", "is_active", "deleted_at", "sort_order", "created_at");

CREATE INDEX "product_variants_public_lookup_idx"
ON "product_variants" ("product_id", "is_active", "deleted_at");
