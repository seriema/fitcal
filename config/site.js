export class SiteConfiguration {
	name: string;
	longName: string;
	url: string;
	domain: string;
}

export const site : SiteConfiguration = {
	name: 'FitCal',
	longName: 'FitCal - Health and fitness tracking; in your calendar',
	url: `${process.env.LIFECAL_SITE_DOMAIN}/fitcal`,
	domain: process.env.LIFECAL_SITE_DOMAIN
};
