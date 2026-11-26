export const queryKeys = {
	approvals: {
		list: (params?: { adoptionId?: string }) =>
			params?.adoptionId
				? (["approvals", params.adoptionId] as const)
				: (["approvals"] as const),
		detail: (id: string) => ["approvals", id] as const,
		admin: (params: {
			shelterFilter: string;
			statusFilters: string[];
			showOverdueOnly: boolean;
		}) =>
			[
				"adminApprovals",
				params.shelterFilter,
				params.statusFilters,
				params.showOverdueOnly,
			] as const,
		shelter: () => ["shelterApprovals"] as const,
	},
	adoptions: {
		list: () => ["adoptions"] as const,
		detail: (id: string) => ["adoption", id] as const,
		status: (id: string) => ["adoption", id, "status"] as const,
		timeline: (id: string) => ["adoption", id, "timeline"] as const,
	},
	notifications: {
		list: (filter?: string) =>
			filter ? (["notifications", filter] as const) : (["notifications"] as const),
		dropdown: () => ["notifications", "dropdown"] as const,
		preferences: () => ["notificationPreferences"] as const,
		count: () => ["notification-count"] as const,
	},
	documents: {
		list: (adoptionId?: string) =>
			adoptionId
				? (["documents", adoptionId] as const)
				: (["documents"] as const),
		detail: (id: string) => ["documents", id] as const,
	},
	disputes: {
		list: (params?: unknown) =>
			params === undefined
				? (["disputes"] as const)
				: (["disputes", params] as const),
		detail: (id: string) => ["disputes", id] as const,
		count: (role: string) => ["dispute-count", role] as const,
	},
	escrow: {
		list: () => ["escrow"] as const,
		detail: (id: string) => ["escrow", id] as const,
		summary: (id: string) => ["escrow", id, "settlement-summary"] as const,
		timeline: (adoptionId: string) => ["escrow-timeline", adoptionId] as const,
	},
	custody: {
		detail: (custodyId: string) => ["custody-details", custodyId] as const,
		timeline: (custodyId: string) => ["custody-timeline", custodyId] as const,
	},
	pets: {
		list: () => ["pets"] as const,
		detail: (id: string) => ["pets", id] as const,
		search: (query: string) => ["pets", "search", query] as const,
	},
	timeline: {
		detail: (adoptionId: string) => ["timeline", adoptionId] as const,
	},
	realtime: {
		status: (entityType: string, entityId: string) =>
			[entityType, entityId] as const,
	},
};
