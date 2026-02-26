import { useState, useEffect } from "react";
import type { Notification } from "../types";
import { notificationService } from "../api/notificationService";

const SuccessIcon = () => (
    <div
        style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#d1fae5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}
    >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

const AdoptionIcon = () => (
    <div
        style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#e0f2fe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
                d="M12 2C8.5 2 6 5 6 8c0 5 6 12 6 12s6-7 6-12c0-3-2.5-6-6-6z"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="8" r="2" stroke="#0ea5e9" strokeWidth="2" />
        </svg>
    </div>
);

const ReminderIcon = () => (
    <div
        style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
        }}
    >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
                d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

const ChevronRight = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <path
            d="M6 4l4 4-4 4"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const getIcon = (type: "success" | "adoption" | "reminder") => {
    if (type === "success") return <SuccessIcon />;
    if (type === "adoption") return <AdoptionIcon />;
    if (type === "reminder") return <ReminderIcon />;
    return <SuccessIcon />;
};

const NotificationPage = () => {
    const [items, setItems] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setIsLoading(true);
                const data = await notificationService.getNotifications();
                setItems(data);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
                setError("Failed to load notifications.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const handleClearAll = async () => {
        // Optimistic update
        setItems([]);
        try {
            await notificationService.clearAll();
        } catch (error) {
            console.error("Failed to clear notifications", error);
            // Optionally reload notifications here if failed
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "red" }}>
                {error}
            </div>
        );
    }

    return (
        <div
            style={{
                fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
                maxWidth: 640,
                margin: "40px auto",
                padding: "0 16px",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                }}
            >
                <h1
                    style={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#111827",
                        margin: 0,
                        letterSpacing: "-0.3px",
                    }}
                >
                    Notifications
                </h1>
                {items.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: 13,
                            color: "#6b7280",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: 6,
                            transition: "background 0.15s",
                        }}
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Notification List */}
            {items.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "60px 0",
                        color: "#9ca3af",
                        fontSize: 15,
                    }}
                >
                    You're all caught up!
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {items.map((notif, index) => (
                        <div key={notif.id}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 14,
                                    padding: "16px 0",
                                    cursor: notif.hasArrow ? "pointer" : "default",
                                    position: "relative",
                                }}
                                onMouseEnter={(e) => {
                                    if (notif.hasArrow)
                                        e.currentTarget.style.backgroundColor = "#fafafa";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                {getIcon(notif.type)}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                        style={{
                                            margin: "0 0 4px",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: "#111827",
                                        }}
                                    >
                                        {notif.title}
                                    </p>
                                    <p
                                        style={{
                                            margin: "0 0 6px",
                                            fontSize: 13.5,
                                            color: "#4b5563",
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        {notif.message}
                                        {notif.meta && (
                                            <span style={{ display: 'block', marginTop: '4px', fontWeight: 500 }}>
                                                {notif.meta.amount && ` Amount: ${notif.meta.amount}`}
                                                {notif.meta.refId && `, Ref ID: ${notif.meta.refId}`}
                                                {notif.meta.adoptionId && ` ID: ${notif.meta.adoptionId}`}
                                            </span>
                                        )}
                                    </p>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                                        {notif.time}
                                    </span>
                                </div>

                                {notif.hasArrow && <ChevronRight />}
                            </div>

                            {index < items.length - 1 && (
                                <div
                                    style={{
                                        height: 1,
                                        backgroundColor: "#f3f4f6",
                                        margin: "0",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default NotificationPage;
