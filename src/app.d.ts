

export {};
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				role: string; // Broaden this to just 'string'
				emailVerified: boolean;
				createdAt: Date;
				updatedAt: Date;
				image?: string | null;
				phoneNumber?: string | null;
				phoneNumberVerified?: boolean; // Added to match Better Auth
			} | null;
			session: import("better-auth").Session | null;
		}
	    // interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

// declare global {
//   namespace App {
//     interface Locals {
//       user: {
//         id: string;
//         name: string;
//         email: string;
//         emailVerified: boolean;
//         image?: string | null;
//         phoneNumber?: string | null;
//         role?: string | null;
//         createdAt: Date;
//         updatedAt: Date;
//       } | null;
//       session: {
//         id: string;
//         userId: string;
//         expiresAt: Date;
//         token: string;
//         ipAddress?: string | null;
//         userAgent?: string | null;
//         createdAt: Date;
//         updatedAt: Date;
//       } | null;
//     }
//   }
// }
// export { };
  
// src/app.d.ts
// declare global {
//   namespace App {
//     // interface Error {}
//     interface Locals {
//       user: {
//         id: string;
//         name: string;
//         email: string;
//         phoneNumber?: string; // Add this line!
//         role?: string;
//       } | null;
//     }
//     interface PageData {
//       user: {
//         id: string;
//         name: string;
//         email: string;
//         phoneNumber?: string; // And this line!
//       } | null;
//     }
//     // interface PageState {}
//     // interface Platform {}
//   }
// }
// export {};
  
// declare global {
//   namespace App {
//     interface Locals {
//       user: {
//         id: string;
//         email?: string;
//         phoneNumber?: string;
//         role: 'user' | 'merchant' | 'admin';
//         banned: boolean;
//       } | null;
//       session: any;
//     }
//     interface PageData {
//       user: import('better-auth').User | null;
//       session: import('better-auth').Session | null;
//     }
//   }
// }

// export {};
