import { type ReactNode, useState } from "react";

export interface EntityDetailLayoutTab {
    label: string;
    content: ReactNode;
}

export interface EntityDetailLayoutProps {
    title: ReactNode | string;
    statusBadge: ReactNode;
    tabs: EntityDetailLayoutTab[];
    sidePanel?: ReactNode;
    onBack?: () => void;
}

export function EntityDetailLayout({
    title,
    statusBadge,
    tabs,
    sidePanel,
    onBack,
}: EntityDetailLayoutProps) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <section className="space-y-6">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={!onBack}
                        aria-label="Go back"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Back
                    </button>
                    <h1 className="truncate text-xl font-semibold text-slate-900">{title}</h1>
                </div>

                <div className="shrink-0">{statusBadge}</div>
            </header>

            <nav aria-label="Entity detail tabs" className="overflow-x-auto">
                <ul className="flex min-w-max gap-2 border-b border-slate-200">
                    {tabs.map((tab, index) => {
                        const isActive = activeTab === index;

                        return (
                            <li key={tab.label}>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(index)}
                                    className={`px-4 py-2 text-sm font-medium transition ${isActive
                                            ? "border-b-2 border-slate-900 text-slate-900"
                                            : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
                                        }`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div
                data-testid="entity-detail-grid"
                className={`grid grid-cols-1 gap-6 ${sidePanel ? "lg:grid-cols-3" : ""}`.trim()}
            >
                <div className={sidePanel ? "lg:col-span-2" : ""}>{tabs[activeTab]?.content}</div>
                {sidePanel ? <aside className="lg:col-span-1">{sidePanel}</aside> : null}
            </div>
        </section>
    );
}

export default EntityDetailLayout;