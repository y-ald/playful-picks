
UPDATE public.products SET image_url = '/__l5e/assets-v1/470d42e2-aa4e-4621-9ddb-bf93936d7dd6/p1-white-bow-a.jpg',
  additional_images = ARRAY['/__l5e/assets-v1/6bb4012a-ee8e-483c-b08d-500eedafbb1a/p1-white-bow-b.jpg']
WHERE id = '3b5cd3f6-4007-45c3-a873-43cf25269abe';

UPDATE public.products SET image_url = '/__l5e/assets-v1/9e22473a-bde8-423c-9902-e46fd0ed0642/p2-red-tulle-a.jpg',
  additional_images = ARRAY['/__l5e/assets-v1/a8b7a0ac-7b7e-4709-be10-15543ef8e7f0/p2-red-tulle-b.jpg']
WHERE id = '7c3b8e3d-f2be-4324-b024-16e1302abbc3';

UPDATE public.products SET image_url = '/__l5e/assets-v1/4afb4d60-bf4b-4c41-8927-462b858ca369/p3-pink-floral-a.jpg',
  additional_images = ARRAY['/__l5e/assets-v1/3d286783-f31c-44da-b7cf-2aa7947e7e8c/p3-pink-floral-b.jpg']
WHERE id = 'c6496223-1c57-4d2b-88e4-99262dba75ac';

UPDATE public.products SET image_url = '/__l5e/assets-v1/80098bfc-3877-49bf-8ee5-ed4ec46f45a2/p4-white-drop.jpg',
  additional_images = ARRAY[]::text[]
WHERE id = '4aede713-2a80-4bd5-af79-d5f1c609834a';

UPDATE public.products SET image_url = '/__l5e/assets-v1/6f1d9005-3e41-409d-8eea-56a9fba09b54/p5-floral-offshoulder.jpg',
  additional_images = ARRAY[]::text[]
WHERE id = '04c43b2b-66b0-4a0d-bf19-55368fd7f6dd';

UPDATE public.products SET image_url = '/__l5e/assets-v1/e98a9121-39ad-47ea-9670-832e1eab58d7/p6-fuchsia-satin.jpg',
  additional_images = ARRAY[]::text[]
WHERE id = 'bda50678-3274-4b1b-8fa7-ba223f41bfe0';

UPDATE public.products SET image_url = '/__l5e/assets-v1/bd93787d-32c6-404a-8c10-5aab4489c91b/p7-pink-print.jpg',
  additional_images = ARRAY[]::text[]
WHERE id = '2870e97b-a8a3-451f-99f5-59bd1040f13d';
