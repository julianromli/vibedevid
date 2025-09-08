-- Insert sample users
INSERT INTO public.users (id, username, display_name, bio, avatar_url, location, website, github_url, twitter_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'sarahchen', 'Sarah Chen', 'Full-stack developer passionate about creating beautiful and functional web applications. Love working with React, Node.js, and modern web technologies.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/professional-woman-dark-hair.png', 'San Francisco, CA', 'https://sarahchen.dev', 'https://github.com/sarahchen', 'https://twitter.com/sarahchen'),
  ('550e8400-e29b-41d4-a716-446655440002', 'marcusrodriguez', 'Marcus Rodriguez', 'UI/UX Designer & Frontend Developer. Specializing in creating intuitive user interfaces and seamless user experiences.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hispanic-man-beard.png', 'Austin, TX', 'https://marcusrodriguez.design', 'https://github.com/marcusrodriguez', 'https://twitter.com/marcusrodriguez'),
  ('550e8400-e29b-41d4-a716-446655440003', 'emmathompson', 'Emma Thompson', 'Creative developer with a passion for innovative web solutions. Experienced in React, TypeScript, and modern CSS frameworks.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/blonde-woman-glasses.png', 'New York, NY', 'https://emmathompson.io', 'https://github.com/emmathompson', 'https://twitter.com/emmathompson'),
  ('550e8400-e29b-41d4-a716-446655440004', 'davidkim', 'David Kim', 'Backend engineer turned full-stack developer. Building scalable web applications with focus on performance and user experience.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/asian-man-short-hair.png', 'Seattle, WA', 'https://davidkim.dev', 'https://github.com/davidkim', 'https://twitter.com/davidkim'),
  ('550e8400-e29b-41d4-a716-446655440005', 'alexrivera', 'Alex Rivera', 'Frontend specialist with expertise in React, Vue, and Angular. Passionate about creating responsive and accessible web interfaces.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-oyaw7.png', 'Miami, FL', 'https://alexrivera.com', 'https://github.com/alexrivera', 'https://twitter.com/alexrivera'),
  ('550e8400-e29b-41d4-a716-446655440006', 'jenniferwalsh', 'Jennifer Walsh', 'Full-stack developer with a focus on modern web technologies. Experience in building complex applications with React and Node.js.', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-oyaw7.png', 'Chicago, IL', 'https://jenniferwalsh.dev', 'https://github.com/jenniferwalsh', 'https://twitter.com/jenniferwalsh');

-- Insert sample projects with slug generation and collision testing
-- Note: This script includes duplicate titles to test slug collision handling
INSERT INTO public.projects (id, title, description, category, image_url, website_url, author_id, slug) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Pointer AI landing page', 'Modern landing page for AI-powered design tool with sleek animations and responsive design.', 'Landing Page', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://pointer.so', '550e8400-e29b-41d4-a716-446655440001', 'pointer-ai-landing-page'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Liquid Glass - Navigation Menu', 'Innovative navigation menu with liquid glass morphism effects and smooth transitions.', 'Personal Web', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://stripe.com', '550e8400-e29b-41d4-a716-446655440002', 'liquid-glass-navigation-menu'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Portfolio - Template by v0', 'Clean and modern portfolio template built with Next.js and Tailwind CSS.', 'Personal Web', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://linear.app', '550e8400-e29b-41d4-a716-446655440003', 'portfolio-template-by-v0'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Marketing Website', 'Comprehensive marketing website with advanced animations and conversion optimization.', 'Landing Page', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://vercel.com', '550e8400-e29b-41d4-a716-446655440004', 'marketing-website'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Cyberpunk dashboard design', 'Futuristic dashboard interface with cyberpunk aesthetics and data visualization.', 'SaaS', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://github.com', '550e8400-e29b-41d4-a716-446655440005', 'cyberpunk-dashboard-design'),
  ('650e8400-e29b-41d4-a716-446655440006', 'Chatroom using GPT-5', 'Real-time chat application powered by GPT-5 with modern UI and seamless user experience.', 'SaaS', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://openai.com', '550e8400-e29b-41d4-a716-446655440006', 'chatroom-using-gpt-5'),
  -- Additional projects to test slug collision handling
  ('650e8400-e29b-41d4-a716-446655440007', 'Marketing Website', 'Another marketing website with different features (tests collision).', 'Landing Page', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://example.com', '550e8400-e29b-41d4-a716-446655440001', 'marketing-website-2'),
  ('650e8400-e29b-41d4-a716-446655440008', 'Marketing Website', 'Third marketing website project (tests multiple collisions).', 'Landing Page', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://example2.com', '550e8400-e29b-41d4-a716-446655440002', 'marketing-website-3'),
  ('650e8400-e29b-41d4-a716-446655440009', 'Test Project', 'Simple test project for slug generation validation.', 'Personal Web', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://test.com', '550e8400-e29b-41d4-a716-446655440003', 'test-project'),
  ('650e8400-e29b-41d4-a716-446655440010', 'Test Project', 'Another test project (collision test).', 'Personal Web', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/invite-bg-GoB0AHj5ZLt6g7O0aaRA5LzEMiJylB.webp', 'https://test2.com', '550e8400-e29b-41d4-a716-446655440004', 'test-project-2');

-- Insert sample likes
INSERT INTO public.likes (project_id, user_id) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002');

-- Insert sample views
INSERT INTO public.views (project_id, user_id) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003'),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440006');

-- Insert sample comments
INSERT INTO public.comments (project_id, user_id, content) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Amazing work! The animations are so smooth and the design is really clean.'),
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Love the color scheme and typography choices. Great attention to detail!'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'The liquid glass effect is incredible! How did you achieve that?'),
  ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Perfect portfolio template. Clean, modern, and very professional.');
