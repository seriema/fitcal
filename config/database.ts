export class DatabaseConfiguration {
	url: string;
}

export const database : DatabaseConfiguration = {
	url: process.env.LIFECAL_MONGODB_URL
};
