import React from 'react';
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AvatarUploaderDemo() {
  	const [photo, setPhoto] = React.useState<string>(
		'https://avatar.vercel.sh/john',
	);

	const handleUpload = async (file: File): Promise<{ success: boolean }> => {
		// Simulate upload process
		console.log('Demo: Uploading file:', file.name);
		
		// Create object URL untuk preview (di production ini akan jadi Supabase URL)
		const newPhotoUrl = URL.createObjectURL(file);
		setPhoto(newPhotoUrl);
		
		return { success: true };
	};

	return (
		<div className="relative flex min-h-screen w-full flex-col items-center justify-center">
			<div
				aria-hidden="true"
				className={cn(
					'pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full',
					'bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]',
					'blur-[30px]',
				)}
			/>

			<div className="text-center space-y-4">
				<h1 className="text-2xl font-bold">Avatar Uploader Demo</h1>
				<p className="text-muted-foreground">Click the avatar to upload and crop your image</p>
				
				<AvatarUploader onUpload={handleUpload}>
					<Avatar className="relative size-20 cursor-pointer hover:opacity-80 transition-opacity mx-auto">
						<AvatarImage src={photo} />
						<AvatarFallback className="border text-2xl font-bold">
							JD
						</AvatarFallback>
					</Avatar>
				</AvatarUploader>
				
				<p className="text-sm text-muted-foreground">
					Current avatar: {photo.includes('blob:') ? 'Uploaded image' : 'Demo avatar'}
				</p>
			</div>
		</div>
	);
}