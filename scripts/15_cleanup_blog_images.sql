-- Migration: Clean up malformed blog image nodes
-- Date: 2025-12-28
-- Issue: Posts have image nodes missing attrs.src property (e.g., {"type":"image"})
-- Fix: Remove malformed image nodes from post content
-- Related: https://github.com/vibedevid/vibedevid_website/issues/XXX

-- Create recursive cleanup function
CREATE OR REPLACE FUNCTION clean_image_nodes_recursive(node JSONB) RETURNS JSONB AS $$
DECLARE
  result JSONB := node;
  i INTEGER;
  item JSONB;
  new_items JSONB := '[]'::jsonb;
BEGIN
  -- If node has content array, process it
  IF node ? 'content' AND jsonb_typeof(node->'content') = 'array' THEN
    new_items := '[]'::jsonb;
    FOR i IN 0..(jsonb_array_length(node->'content') - 1) LOOP
      item := node->'content'->i;

      -- Skip malformed image nodes (type=image without attrs.src)
      IF item ? 'type' AND item->>'type' = 'image' 
         AND NOT (item ? 'attrs' AND item->'attrs' ? 'src' AND item->'attrs'->>'src' != '') THEN
        CONTINUE;
      END IF;

      -- Recursively clean child nodes
      IF item ? 'content' THEN
        item := jsonb_set(item, '{content}',
          (SELECT jsonb_agg(clean_image_nodes_recursive(elem))
           FROM jsonb_array_elements(item->'content') AS elem));
      END IF;

      new_items := new_items || item;
    END LOOP;
    result := jsonb_set(node, '{content}', new_items);
  END IF;

  RETURN result;
END $$ LANGUAGE plpgsql;

-- Update all posts with cleaned content
UPDATE posts
SET content = clean_image_nodes_recursive(content::jsonb)
WHERE content IS NOT NULL;

-- Clean up the function
DROP FUNCTION IF EXISTS clean_image_nodes_recursive(JSONB);
