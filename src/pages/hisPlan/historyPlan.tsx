import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    getPlans,
    getPlanById,
    deletePlan,
    duplicatePlan,
    archivePlan,
    restorePlan,
    completePlan,
    activatePlan,
    getPlanProgress,
    exportPlan,
    sharePlan,
    updatePlan,
    savePlan,
    PlanHistoryResponse,
    PlanData
} from '../../utils/api/generatePlanApi';
import {
    Search,
    Filter,
    MoreVertical,
    Edit,
    Copy,
    Archive,
    Trash2,
    Share2,
    Download,
    Play,
    CheckCircle,
    RotateCcw,
    Calendar,
    Clock,
    User,
    Tag,
    TrendingUp,
    AlertCircle,
    Loader2,
    Plus,
    Grid,
    List,
    SortAsc,
    SortDesc,
    Eye,
    Star,
    StarOff,
    Settings,
    ChevronDown,
    ChevronRight,
    FileText,
    BarChart3,
    Target,
    Zap,
    Brain,
    Users,
    Globe,
    Lock,
    X,
    Save,
    RefreshCw,
    ExternalLink,
    Bookmark,
    BookmarkCheck,
    FolderOpen,
    FolderClosed,
    ChevronLeft,
    ChevronUp
} from 'lucide-react';

// Enhanced Interfaces
interface Plan {
    id: string;
    title: string;
    description?: string;
    objective?: string;
    category: 'personal' | 'work' | 'education' | 'health' | 'finance' | 'travel' | 'other';
    status: 'draft' | 'active' | 'completed' | 'archived' | 'paused';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    source: 'manual' | 'ai-generated';
    createdAt: string;
    updatedAt: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    tasks?: any[];
    steps?: any[];
    risks?: any[];
    collaborators?: any[];
    progress?: number | { totalTasks: number; completedTasks: number; percentage: number };
    isBookmarked?: boolean;
    shareSettings?: {
        isPublic: boolean;
        shareLink?: string;
        permissions: 'view' | 'edit' | 'comment';
    };
    metadata?: {
        generatedAt?: string;
        originalInput?: string;
        estimatedDuration?: number;
        difficulty?: 'easy' | 'medium' | 'hard';
    };
}

interface FilterState {
    search: string;
    category: string;
    status: string;
    priority: string;
    source: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    isBookmarked: boolean;
}

type ViewMode = 'grid' | 'list' | 'kanban';

const HistoryPlan: React.FC = () => {
    // Core States
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // UI States
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // Enhanced Filters
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        category: '',
        status: '',
        priority: '',
        source: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        dateRange: 'all',
        isBookmarked: false
    });

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        completed: 0,
        draft: 0,
        archived: 0
    });

    // Fetch plans function
    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== '' && value !== false) {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);

            const response: PlanHistoryResponse = await getPlans(
                currentPage,
                itemsPerPage,
                cleanFilters
            );

            if (response.success && response.data) {
                setPlans(response.data as Plan[]);
                if (response.pagination) {
                    setTotalPages(response.pagination.totalPages);
                    setTotalItems(response.pagination.totalItems);
                }

                // Update statistics
                const planData = response.data as Plan[];
                setStats({
                    total: planData.length,
                    active: planData.filter(p => p.status === 'active').length,
                    completed: planData.filter(p => p.status === 'completed').length,
                    draft: planData.filter(p => p.status === 'draft').length,
                    archived: planData.filter(p => p.status === 'archived').length
                });
            } else {
                setError(response.message || 'Không thể tải danh sách kế hoạch');
            }
        } catch (err: any) {
            console.error('Error fetching plans:', err);
            setError(err.message || 'Lỗi không xác định khi tải kế hoạch');
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters]);

    // Effects
    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // Debounced search
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (filters.search !== '') {
                setCurrentPage(1);
                fetchPlans();
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [filters.search]);

    // Filter handlers
    const handleFilterChange = (key: keyof FilterState, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            category: '',
            status: '',
            priority: '',
            source: '',
            sortBy: 'updatedAt',
            sortOrder: 'desc',
            dateRange: 'all',
            isBookmarked: false
        });
        setCurrentPage(1);
    };

    // Plan actions
    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) return;

        try {
            setActionLoading(planId);
            const response = await deletePlan(planId);

            if (response.success) {
                setPlans(prev => prev.filter(plan => plan.id !== planId));
                setSelectedPlans(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(planId);
                    return newSet;
                });
                alert('Xóa kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể xóa kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi xóa kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDuplicatePlan = async (planId: string, title: string) => {
        const newTitle = prompt('Nhập tên mới cho kế hoạch:', `Copy of ${title}`);
        if (!newTitle) return;

        try {
            setActionLoading(planId);
            const response = await duplicatePlan(planId, newTitle);

            if (response.success) {
                fetchPlans();
                alert('Sao chép kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể sao chép kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi sao chép kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleArchivePlan = async (planId: string) => {
        try {
            setActionLoading(planId);
            const response = await archivePlan(planId);

            if (response.success) {
                fetchPlans();
                alert('Lưu trữ kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể lưu trữ kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi lưu trữ kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestorePlan = async (planId: string) => {
        try {
            setActionLoading(planId);
            const response = await restorePlan(planId);

            if (response.success) {
                fetchPlans();
                alert('Khôi phục kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể khôi phục kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi khôi phục kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCompletePlan = async (planId: string) => {
        try {
            setActionLoading(planId);
            const response = await completePlan(planId);

            if (response.success) {
                fetchPlans();
                alert('Đánh dấu hoàn thành kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể hoàn thành kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi hoàn thành kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivatePlan = async (planId: string) => {
        try {
            setActionLoading(planId);
            const response = await activatePlan(planId);

            if (response.success) {
                fetchPlans();
                alert('Kích hoạt kế hoạch thành công!');
            } else {
                alert(response.message || 'Không thể kích hoạt kế hoạch');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi kích hoạt kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSharePlan = async (planId: string, permissions: 'view' | 'edit' | 'comment' = 'view') => {
        try {
            setActionLoading(planId);
            const response = await sharePlan(planId, permissions);

            if (response.success && response.data?.shareLink) {
                navigator.clipboard.writeText(response.data.shareLink);
                alert('Link chia sẻ đã được sao chép vào clipboard!');
            } else {
                alert(response.message || 'Không thể tạo link chia sẻ');
            }
        } catch (error: any) {
            alert(error.message || 'Lỗi khi chia sẻ kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportPlan = async (planId: string, format: 'json' | 'csv' | 'pdf' | 'xlsx' = 'json') => {
        try {
            setActionLoading(planId);
            const data = await exportPlan(planId, format);

            const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
                type: format === 'json' ? 'application/json' : 'application/octet-stream'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `plan-${planId}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Xuất kế hoạch thành công!');
        } catch (error: any) {
            alert(error.message || 'Lỗi khi xuất kế hoạch');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBookmarkPlan = async (planId: string) => {
        // This would be implemented with a bookmark API endpoint
        setPlans(prev => prev.map(plan =>
            plan.id === planId
                ? { ...plan, isBookmarked: !plan.isBookmarked }
                : plan
        ));
    };

    // Bulk actions
    const handleBulkAction = async (action: string) => {
        if (selectedPlans.size === 0) return;

        const planIds = Array.from(selectedPlans);

        try {
            setActionLoading('bulk');

            switch (action) {
                case 'delete':
                    if (!confirm(`Bạn có chắc chắn muốn xóa ${planIds.length} kế hoạch?`)) return;
                    await Promise.all(planIds.map(id => deletePlan(id)));
                    setPlans(prev => prev.filter(plan => !selectedPlans.has(plan.id)));
                    break;
                case 'archive':
                    await Promise.all(planIds.map(id => archivePlan(id)));
                    break;
                case 'activate':
                    await Promise.all(planIds.map(id => activatePlan(id)));
                    break;
                case 'complete':
                    await Promise.all(planIds.map(id => completePlan(id)));
                    break;
            }

            setSelectedPlans(new Set());
            fetchPlans();
            alert('Thực hiện thành công!');
        } catch (error: any) {
            alert(error.message || 'Có lỗi xảy ra');
        } finally {
            setActionLoading(null);
        }
    };

    // Utility functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800 border-green-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'work': return <Target className="w-4 h-4" />;
            case 'personal': return <User className="w-4 h-4" />;
            case 'education': return <FileText className="w-4 h-4" />;
            case 'health': return <Zap className="w-4 h-4" />;
            case 'finance': return <BarChart3 className="w-4 h-4" />;
            case 'travel': return <Globe className="w-4 h-4" />;
            default: return <FolderOpen className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getProgressPercentage = (progress: number | { totalTasks: number; completedTasks: number; percentage: number } | undefined): number => {
        if (progress === undefined) return 0;
        if (typeof progress === 'number') return progress;
        if (typeof progress === 'object' && progress.percentage !== undefined) {
            return progress.percentage;
        }
        return 0;
    };

    // Memoized filtered and sorted plans
    const filteredPlans = useMemo(() => {
        return plans.filter(plan => {
            if (filters.search && !plan.title.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }
            if (filters.category && plan.category !== filters.category) {
                return false;
            }
            if (filters.status && plan.status !== filters.status) {
                return false;
            }
            if (filters.priority && plan.priority !== filters.priority) {
                return false;
            }
            if (filters.source && plan.source !== filters.source) {
                return false;
            }
            if (filters.isBookmarked && !plan.isBookmarked) {
                return false;
            }
            return true;
        });
    }, [plans, filters]);

    // Loading state
    if (loading && plans.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Đang tải kế hoạch của bạn...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && plans.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchPlans}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                            >
                                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            </button>

                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Kế hoạch của tôi</h1>
                                <p className="text-sm text-gray-600">
                                    Quản lý và theo dõi {totalItems} kế hoạch
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Quick Stats */}
                            <div className="hidden md:flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{stats.active} Đang thực hiện</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>{stats.completed} Hoàn thành</span>
                                </div>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                        }`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Create New Plan */}
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Tạo kế hoạch</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex">
                {/* Sidebar */}
                <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-200 min-h-screen`}>
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        {!sidebarCollapsed && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm kế hoạch..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                        )}

                        {/* Quick Filters */}
                        <div className="space-y-2">
                            <button
                                onClick={() => handleFilterChange('status', '')}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${filters.status === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                {!sidebarCollapsed && <span>Tất cả kế hoạch</span>}
                            </button>

                            <button
                                onClick={() => handleFilterChange('status', 'active')}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${filters.status === 'active' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Play className="w-4 h-4" />
                                {!sidebarCollapsed && <span>Đang thực hiện</span>}
                            </button>

                            <button
                                onClick={() => handleFilterChange('status', 'completed')}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${filters.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {!sidebarCollapsed && <span>Hoàn thành</span>}
                            </button>

                            <button
                                onClick={() => handleFilterChange('isBookmarked', !filters.isBookmarked)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${filters.isBookmarked ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Star className="w-4 h-4" />
                                {!sidebarCollapsed && <span>Đã đánh dấu</span>}
                            </button>

                            <button
                                onClick={() => handleFilterChange('status', 'archived')}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${filters.status === 'archived' ? 'bg-gray-50 text-gray-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Archive className="w-4 h-4" />
                                {!sidebarCollapsed && <span>Lưu trữ</span>}
                            </button>
                        </div>

                        {/* Categories */}
                        {!sidebarCollapsed && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Danh mục
                                </h3>
                                <div className="space-y-1">
                                    {[
                                        { key: 'work', label: 'Công việc', icon: Target },
                                        { key: 'personal', label: 'Cá nhân', icon: User },
                                        { key: 'education', label: 'Giáo dục', icon: FileText },
                                        { key: 'health', label: 'Sức khỏe', icon: Zap },
                                        { key: 'finance', label: 'Tài chính', icon: BarChart3 },
                                        { key: 'travel', label: 'Du lịch', icon: Globe }
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => handleFilterChange('category', filters.category === key ? '' : key)}
                                            className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-sm transition-colors ${filters.category === key ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="flex items-center space-x-2">
                                                <Icon className="w-4 h-4" />
                                                <span>{label}</span>
                                            </span>
                                        </button>
                                    ))}
                            </div>
                            </div>
                        )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                {/* Filters Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                <span>Bộ lọc</span>
                                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {selectedPlans.size > 0 && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">
                                        Đã chọn {selectedPlans.size} kế hoạch
                                    </span>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleBulkAction('activate')}
                                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            Kích hoạt
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('complete')}
                                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                            Hoàn thành
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('archive')}
                                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                            Lưu trữ
                                        </button>
                                        <button
                                            onClick={() => handleBulkAction('delete')}
                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                                <option value={12}>12 / trang</option>
                                <option value={24}>24 / trang</option>
                                <option value={48}>48 / trang</option>
                            </select>

                            <button
                                onClick={fetchPlans}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <select
                                    value={filters.priority}
                                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Tất cả độ ưu tiên</option>
                                    <option value="urgent">🔴 Khẩn cấp</option>
                                    <option value="high">🟠 Cao</option>
                                    <option value="medium">🟡 Trung bình</option>
                                    <option value="low">🟢 Thấp</option>
                                </select>

                                <select
                                    value={filters.source}
                                    onChange={(e) => handleFilterChange('source', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">Tất cả nguồn</option>
                                    <option value="ai-generated">🤖 AI tạo</option>
                                    <option value="manual">✋ Thủ công</option>
                                </select>

                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    <option value="today">Hôm nay</option>
                                    <option value="week">Tuần này</option>
                                    <option value="month">Tháng này</option>
                                    <option value="year">Năm này</option>
                                </select>

                                <div className="flex items-center space-x-2">
                                    <select
                                        value={`${filters.sortBy}-${filters.sortOrder}`}
                                        onChange={(e) => {
                                            const [sortBy, sortOrder] = e.target.value.split('-');
                                            handleFilterChange('sortBy', sortBy);
                                            handleFilterChange('sortOrder', sortOrder);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                                    >
                                        <option value="updatedAt-desc">Mới nhất</option>
                                        <option value="updatedAt-asc">Cũ nhất</option>
                                        <option value="title-asc">Tên A-Z</option>
                                        <option value="title-desc">Tên Z-A</option>
                                        <option value="priority-desc">Ưu tiên cao</option>
                                        <option value="createdAt-desc">Ngày tạo mới</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Xóa bộ lọc
                                </button>
                                <div className="text-sm text-gray-600">
                                    Hiển thị {filteredPlans.length} / {totalItems} kế hoạch
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Plans Content */}
                {filteredPlans.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {filters.search || filters.category || filters.status ?
                                    'Không tìm thấy kế hoạch nào' :
                                    'Chưa có kế hoạch nào'
                                }
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {filters.search || filters.category || filters.status ?
                                    'Thử thay đổi bộ lọc để tìm thấy kế hoạch bạn cần' :
                                    'Hãy tạo kế hoạch đầu tiên của bạn với sự hỗ trợ của AI'
                                }
                            </p>
                            <div className="flex justify-center space-x-3">
                                {(filters.search || filters.category || filters.status) && (
                                    <button
                                        onClick={resetFilters}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                                    <Plus className="w-4 h-4" />
                                    <span>Tạo kế hoạch mới</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Grid View */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredPlans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        isSelected={selectedPlans.has(plan.id)}
                                        onSelect={(selected) => {
                                            const newSet = new Set(selectedPlans);
                                            if (selected) {
                                                newSet.add(plan.id);
                                            } else {
                                                newSet.delete(plan.id);
                                            }
                                            setSelectedPlans(newSet);
                                        }}
                                        onView={() => setSelectedPlan(plan)}
                                        onEdit={() => {/* Navigate to edit */ }}
                                        onDuplicate={() => handleDuplicatePlan(plan.id, plan.title)}
                                        onShare={() => handleSharePlan(plan.id)}
                                        onExport={() => handleExportPlan(plan.id)}
                                        onArchive={() => handleArchivePlan(plan.id)}
                                        onRestore={() => handleRestorePlan(plan.id)}
                                        onActivate={() => handleActivatePlan(plan.id)}
                                        onComplete={() => handleCompletePlan(plan.id)}
                                        onDelete={() => handleDeletePlan(plan.id)}
                                        onBookmark={() => handleBookmarkPlan(plan.id)}
                                        actionLoading={actionLoading === plan.id}
                                        getStatusColor={getStatusColor}
                                        getPriorityColor={getPriorityColor}
                                        getCategoryIcon={getCategoryIcon}
                                        formatDate={formatDate}
                                        getProgressPercentage={getProgressPercentage}
                                    />
                                ))}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlans.size === filteredPlans.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedPlans(new Set(filteredPlans.map(p => p.id)));
                                                } else {
                                                    setSelectedPlans(new Set());
                                                }
                                            }}
                                            className="mr-4"
                                        />
                                        <div className="grid grid-cols-12 gap-4 w-full text-sm font-medium text-gray-700">
                                            <div className="col-span-4">Tiêu đề</div>
                                            <div className="col-span-2">Trạng thái</div>
                                            <div className="col-span-2">Danh mục</div>
                                            <div className="col-span-2">Tiến độ</div>
                                            <div className="col-span-2">Cập nhật</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-200">
                                    {filteredPlans.map((plan) => (
                                        <PlanListItem
                                            key={plan.id}
                                            plan={plan}
                                            isSelected={selectedPlans.has(plan.id)}
                                            onSelect={(selected) => {
                                                const newSet = new Set(selectedPlans);
                                                if (selected) {
                                                    newSet.add(plan.id);
                                                } else {
                                                    newSet.delete(plan.id);
                                                }
                                                setSelectedPlans(newSet);
                                            }}
                                            onView={() => setSelectedPlan(plan)}
                                            actionLoading={actionLoading === plan.id}
                                            getStatusColor={getStatusColor}
                                            getPriorityColor={getPriorityColor}
                                            getCategoryIcon={getCategoryIcon}
                                            formatDate={formatDate}
                                            getProgressPercentage={getProgressPercentage}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Kanban View */}
                        {viewMode === 'kanban' && (
                            <KanbanView
                                plans={filteredPlans}
                                onPlanMove={(planId, newStatus) => {
                                    // Handle plan status change
                                    setPlans(prev => prev.map(plan =>
                                        plan.id === planId ? { ...plan, status: newStatus } : plan
                                    ));
                                }}
                                onPlanClick={setSelectedPlan}
                                getStatusColor={getStatusColor}
                                getPriorityColor={getPriorityColor}
                                getProgressPercentage={getProgressPercentage}
                            />
                        )}
                    </>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>Trước</span>
                        </button>

                        <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                                return (
                                    <button
                                        key={`page-${pageNum}`}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-2 rounded-lg transition-colors ${currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center space-x-1"
                        >
                            <span>Tiếp</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>

            {/* Plan Detail Modal */ }
    {
        selectedPlan && (
            <PlanDetailModal
                plan={selectedPlan}
                onClose={() => setSelectedPlan(null)}
                onEdit={() => {/* Navigate to edit */ }}
                onDuplicate={() => handleDuplicatePlan(selectedPlan.id, selectedPlan.title)}
                onShare={() => handleSharePlan(selectedPlan.id)}
                onExport={() => handleExportPlan(selectedPlan.id)}
                onArchive={() => handleArchivePlan(selectedPlan.id)}
                onRestore={() => handleRestorePlan(selectedPlan.id)}
                onActivate={() => handleActivatePlan(selectedPlan.id)}
                onComplete={() => handleCompletePlan(selectedPlan.id)}
                onDelete={() => handleDeletePlan(selectedPlan.id)}
                onBookmark={() => handleBookmarkPlan(selectedPlan.id)}
                actionLoading={actionLoading === selectedPlan.id}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
                getCategoryIcon={getCategoryIcon}
                formatDate={formatDate}
                getProgressPercentage={getProgressPercentage}
            />
        )
    }
        </div >
    );
};

// Plan Card Component
const PlanCard: React.FC<{
    plan: Plan;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onView: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onShare: () => void;
    onExport: () => void;
    onArchive: () => void;
    onRestore: () => void;
    onActivate: () => void;
    onComplete: () => void;
    onDelete: () => void;
    onBookmark: () => void;
    actionLoading: boolean;
    getStatusColor: (status: string) => string;
    getPriorityColor: (priority: string) => string;
    getCategoryIcon: (category: string) => React.ReactNode;
    formatDate: (date: string) => string;
    getProgressPercentage: (progress: any) => number;
}> = ({
    plan,
    isSelected,
    onSelect,
    onView,
    onEdit,
    onDuplicate,
    onShare,
    onExport,
    onArchive,
    onRestore,
    onActivate,
    onComplete,
    onDelete,
    onBookmark,
    actionLoading,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    formatDate,
    getProgressPercentage
}) => {
        const [showMenu, setShowMenu] = useState(false);

        return (
            <div className={`bg-white rounded-lg border-2 transition-all hover:shadow-md ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200'
                }`}>
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => onSelect(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <button
                                onClick={onBookmark}
                                className={`p-1 rounded hover:bg-gray-100 ${plan.isBookmarked ? 'text-yellow-500' : 'text-gray-400'
                                    }`}
                            >
                                {plan.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                {actionLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MoreVertical className="w-4 h-4" />
                                )}
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button
                                            onClick={() => { onView(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>Xem chi tiết</span>
                                        </button>

                                        <button
                                            onClick={() => { onEdit(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Chỉnh sửa</span>
                                        </button>

                                        <button
                                            onClick={() => { onDuplicate(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Copy className="w-4 h-4" />
                                            <span>Sao chép</span>
                                        </button>

                                        <button
                                            onClick={() => { onShare(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            <span>Chia sẻ</span>
                                        </button>

                                        <button
                                            onClick={() => { onExport(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Xuất file</span>
                                        </button>

                                        <hr className="my-1" />

                                        {plan.status === 'draft' && (
                                            <button
                                                onClick={() => { onActivate(); setShowMenu(false); }}
                                                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                            >
                                                <Play className="w-4 h-4" />
                                                <span>Kích hoạt</span>
                                            </button>
                                        )}

                                        {plan.status === 'active' && (
                                            <button
                                                onClick={() => { onComplete(); setShowMenu(false); }}
                                                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Hoàn thành</span>
                                            </button>
                                        )}

                                        {plan.status !== 'archived' ? (
                                            <button
                                                onClick={() => { onArchive(); setShowMenu(false); }}
                                                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                            >
                                                <Archive className="w-4 h-4" />
                                                <span>Lưu trữ</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { onRestore(); setShowMenu(false); }}
                                                className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Khôi phục</span>
                                            </button>
                                        )}

                                        <hr className="my-1" />

                                        <button
                                            onClick={() => { onDelete(); setShowMenu(false); }}
                                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Xóa</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <h3
                        className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 mb-2"
                        onClick={onView}
                    >
                        {plan.title}
                    </h3>

                    {plan.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                            {plan.status === 'active' ? 'Đang thực hiện' :
                                plan.status === 'completed' ? 'Hoàn thành' :
                                    plan.status === 'archived' ? 'Lưu trữ' :
                                        plan.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(plan.priority)}`}>
                            {plan.priority === 'urgent' ? 'Khẩn cấp' :
                                plan.priority === 'high' ? 'Cao' :
                                    plan.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                        </span>
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                    {/* Progress */}
                    {plan.progress !== undefined && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-600">Tiến độ</span>
                                <span className="text-xs text-gray-600">{getProgressPercentage(plan.progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${getProgressPercentage(plan.progress)}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Meta Info */}
                    <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                                {getCategoryIcon(plan.category)}
                                <span className="capitalize">{plan.category}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                {plan.source === 'ai-generated' ? (
                                    <Brain className="w-3 h-3" />
                                ) : (
                                    <User className="w-3 h-3" />
                                )}
                                <span>{plan.source === 'ai-generated' ? 'AI' : 'Thủ công'}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(plan.updatedAt)}</span>
                        </div>

                        {plan.tasks && (
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-3 h-3" />
                                <span>{plan.tasks.length} nhiệm vụ</span>
                            </div>
                        )}

                        {plan.collaborators && plan.collaborators.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <Users className="w-3 h-3" />
                                <span>{plan.collaborators.length} cộng tác viên</span>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {plan.tags && plan.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {plan.tags.slice(0, 2).map((tag, index) => (
                                <span key={`${plan.id}-tag-${index}`} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    {tag}
                                </span>
                            ))}
                            {plan.tags.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                    +{plan.tags.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

// Plan List Item Component
const PlanListItem: React.FC<{
    plan: Plan;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onView: () => void;
    actionLoading: boolean;
    getStatusColor: (status: string) => string;
    getPriorityColor: (priority: string) => string;
    getCategoryIcon: (category: string) => React.ReactNode;
    formatDate: (date: string) => string;
    getProgressPercentage: (progress: any) => number;
}> = ({
    plan,
    isSelected,
    onSelect,
    onView,
    actionLoading,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    formatDate,
    getProgressPercentage
}) => {
        return (
            <div className={`px-6 py-4 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(e.target.checked)}
                        className="mr-4 rounded border-gray-300"
                    />
                    <div className="grid grid-cols-12 gap-4 w-full items-center">
                        {/* Title */}
                        <div className="col-span-4">
                            <div className="flex items-center space-x-3">
                                {plan.isBookmarked && <Star className="w-4 h-4 text-yellow-500" />}
                                <div>
                                    <h3
                                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 line-clamp-1"
                                        onClick={onView}
                                    >
                                        {plan.title}
                                    </h3>
                                    {plan.description && (
                                        <p className="text-sm text-gray-600 line-clamp-1">{plan.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
                                {plan.status === 'active' ? 'Đang thực hiện' :
                                    plan.status === 'completed' ? 'Hoàn thành' :
                                        plan.status === 'archived' ? 'Lưu trữ' :
                                            plan.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                            </span>
                        </div>

                        {/* Category */}
                        <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                                {getCategoryIcon(plan.category)}
                                <span className="text-sm text-gray-700 capitalize">{plan.category}</span>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${getProgressPercentage(plan.progress)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-600 w-8">{getProgressPercentage(plan.progress)}%</span>
                            </div>
                        </div>

                        {/* Updated */}
                        <div className="col-span-2">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(plan.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

// Kanban View Component
const KanbanView: React.FC<{
    plans: Plan[];
    onPlanMove: (planId: string, newStatus: Plan['status']) => void;
    onPlanClick: (plan: Plan) => void;
    getStatusColor: (status: string) => string;
    getPriorityColor: (priority: string) => string;
    getProgressPercentage: (progress: any) => number;
}> = ({
    plans,
    onPlanMove,
    onPlanClick,
    getStatusColor,
    getPriorityColor,
    getProgressPercentage
}) => {
        const columns: { status: Plan['status']; title: string; color: string }[] = [
            { status: 'draft', title: 'Nháp', color: 'bg-gray-100' },
            { status: 'active', title: 'Đang thực hiện', color: 'bg-blue-100' },
            { status: 'paused', title: 'Tạm dừng', color: 'bg-yellow-100' },
            { status: 'completed', title: 'Hoàn thành', color: 'bg-green-100' },
            { status: 'archived', title: 'Lưu trữ', color: 'bg-gray-100' }
        ];

        return (
            <div className="flex space-x-6 overflow-x-auto pb-6">
                {columns.map((column) => {
                    const columnPlans = plans.filter(plan => plan.status === column.status);

                    return (
                        <div key={column.status} className="flex-shrink-0 w-80">
                            <div className={`${column.color} rounded-lg p-3 mb-4`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                    <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                                        {columnPlans.length}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 min-h-[200px]">
                                {columnPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => onPlanClick(plan)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 line-clamp-2">{plan.title}</h4>
                                            {plan.isBookmarked && <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />}
                                        </div>

                                        {plan.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
                                        )}

                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(plan.priority)}`}>
                                                {plan.priority === 'urgent' ? '🔴' :
                                                    plan.priority === 'high' ? '🟠' :
                                                        plan.priority === 'medium' ? '🟡' : '🟢'}
                                            </span>
                                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                                                {plan.source === 'ai-generated' ? (
                                                    <Brain className="w-3 h-3" />
                                                ) : (
                                                    <User className="w-3 h-3" />
                                                )}
                                            </div>
                                        </div>

                                        {plan.progress !== undefined && (
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-gray-600">Tiến độ</span>
                                                    <span className="text-xs text-gray-600">{getProgressPercentage(plan.progress)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{ width: `${getProgressPercentage(plan.progress)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(plan.updatedAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            {plan.tasks && (
                                                <div className="flex items-center space-x-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>{plan.tasks.length}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

// Plan Detail Modal Component
const PlanDetailModal: React.FC<{
    plan: Plan;
    onClose: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onShare: () => void;
    onExport: () => void;
    onArchive: () => void;
    onRestore: () => void;
    onActivate: () => void;
    onComplete: () => void;
    onDelete: () => void;
    onBookmark: () => void;
    actionLoading: boolean;
    getStatusColor: (status: string) => string;
    getPriorityColor: (priority: string) => string;
    getCategoryIcon: (category: string) => React.ReactNode;
    formatDate: (date: string) => string;
    getProgressPercentage: (progress: any) => number;
}> = ({
    plan,
    onClose,
    onEdit,
    onDuplicate,
    onShare,
    onExport,
    onArchive,
    onRestore,
    onActivate,
    onComplete,
    onDelete,
    onBookmark,
    actionLoading,
    getStatusColor,
    getPriorityColor,
    getCategoryIcon,
    formatDate,
    getProgressPercentage
}) => {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-8">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <button
                                            onClick={onBookmark}
                                            className={`p-2 rounded-lg hover:bg-gray-100 ${plan.isBookmarked ? 'text-yellow-500' : 'text-gray-400'
                                                }`}
                                        >
                                            {plan.isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                                        </button>
                                        <h1 className="text-3xl font-bold text-gray-900">{plan.title}</h1>
                                    </div>

                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(plan.status)}`}>
                                            {plan.status === 'active' ? 'Đang thực hiện' :
                                                plan.status === 'completed' ? 'Hoàn thành' :
                                                    plan.status === 'archived' ? 'Lưu trữ' :
                                                        plan.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(plan.priority)}`}>
                                            {plan.priority === 'urgent' ? 'Khẩn cấp' :
                                                plan.priority === 'high' ? 'Cao' :
                                                    plan.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                        </span>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            {getCategoryIcon(plan.category)}
                                            <span className="capitalize">{plan.category}</span>
                                        </div>
                                    </div>

                                    {plan.description && (
                                        <p className="text-gray-700 text-lg leading-relaxed mb-6">{plan.description}</p>
                                    )}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg ml-4"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Progress Section */}
                            {plan.progress !== undefined && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiến độ thực hiện</h2>
                                    <div className="bg-gray-50 rounded-lg p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">Hoàn thành</span>
                                            <span className="text-2xl font-bold text-blue-600">{getProgressPercentage(plan.progress)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className="bg-blue-600 h-3 rounded-full transition-all"
                                                style={{ width: `${getProgressPercentage(plan.progress)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Objective Section */}
                            {plan.objective && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Mục tiêu</h2>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                        <p className="text-gray-800">{plan.objective}</p>
                                    </div>
                                </div>
                            )}

                            {/* Steps Section */}
                            {plan.steps && plan.steps.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Các bước thực hiện</h2>
                                    <div className="space-y-4">
                                        {plan.steps.map((step: any, index: number) => (
                                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start space-x-4">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900 mb-2">{step.description}</h3>
                                                        {step.timeline && (
                                                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{step.timeline}</span>
                                                            </div>
                                                        )}
                                                        {step.resources && (
                                                            <div className="text-sm text-gray-600">
                                                                <strong>Tài nguyên:</strong> {step.resources}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tasks Section */}
                            {plan.tasks && plan.tasks.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Nhiệm vụ ({plan.tasks.length})
                                    </h2>
                                    <div className="space-y-2">
                                        {plan.tasks.slice(0, 10).map((task: any, index: number) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <span className="text-gray-700">{task.title || task.description || `Nhiệm vụ ${index + 1}`}</span>
                                            </div>
                                        ))}
                                        {plan.tasks.length > 10 && (
                                            <p className="text-sm text-gray-500 text-center py-2">
                                                ... và {plan.tasks.length - 10} nhiệm vụ khác
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Risks Section */}
                            {plan.risks && plan.risks.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Rủi ro và giải pháp</h2>
                                    <div className="space-y-4">
                                        {plan.risks.map((risk: any, index: number) => (
                                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <div className="flex items-start space-x-3">
                                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="font-medium text-red-900 mb-2">{risk.risk}</h3>
                                                        <p className="text-red-700 text-sm">
                                                            <strong>Giải pháp:</strong> {risk.mitigation}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Collaborators Section */}
                            {plan.collaborators && plan.collaborators.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                        Cộng tác viên ({plan.collaborators.length})
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {plan.collaborators.map((collaborator: any, index: number) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {collaborator.name || `Cộng tác viên ${index + 1}`}
                                                    </p>
                                                    {collaborator.email && (
                                                        <p className="text-sm text-gray-600">{collaborator.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags Section */}
                            {plan.tags && plan.tags.length > 0 && (
                                <div className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Thẻ</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.tags.map((tag: string, index: number) => (
                                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Metadata Section */}
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin chi tiết</h2>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <Calendar className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Ngày tạo</p>
                                                    <p className="font-medium text-gray-900">{formatDate(plan.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Clock className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Cập nhật lần cuối</p>
                                                    <p className="font-medium text-gray-900">{formatDate(plan.updatedAt)}</p>
                                                </div>
                                            </div>

                                            {plan.startDate && (
                                                <div className="flex items-center space-x-3">
                                                    <Play className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                                                        <p className="font-medium text-gray-900">{formatDate(plan.startDate)}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {plan.endDate && (
                                                <div className="flex items-center space-x-3">
                                                    <CheckCircle className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Ngày kết thúc</p>
                                                        <p className="font-medium text-gray-900">{formatDate(plan.endDate)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <Tag className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Danh mục</p>
                                                    <p className="font-medium text-gray-900 capitalize">{plan.category}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <TrendingUp className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="text-sm text-gray-600">Nguồn tạo</p>
                                                    <p className="font-medium text-gray-900">
                                                        {plan.source === 'ai-generated' ? 'AI tạo tự động' : 'Tạo thủ công'}
                                                    </p>
                                                </div>
                                            </div>

                                            {plan.shareSettings?.isPublic && (
                                                <div className="flex items-center space-x-3">
                                                    <Globe className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Trạng thái chia sẻ</p>
                                                        <p className="font-medium text-gray-900">Công khai</p>
                                                    </div>
                                                </div>
                                            )}

                                            {plan.metadata?.estimatedDuration && (
                                                <div className="flex items-center space-x-3">
                                                    <Clock className="w-5 h-5 text-gray-500" />
                                                    <div>
                                                        <p className="text-sm text-gray-600">Thời gian ước tính</p>
                                                        <p className="font-medium text-gray-900">{plan.metadata.estimatedDuration} ngày</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Sidebar */}
                    <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Hành động</h3>

                        <div className="space-y-3">
                            <button
                                onClick={onEdit}
                                className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                disabled={actionLoading}
                            >
                                <Edit className="w-5 h-5" />
                                <span>Chỉnh sửa</span>
                            </button>

                            <button
                                onClick={onDuplicate}
                                className="w-full flex items-center space-x-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={actionLoading}
                            >
                                <Copy className="w-5 h-5" />
                                <span>Sao chép</span>
                            </button>

                            <button
                                onClick={onShare}
                                className="w-full flex items-center space-x-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={actionLoading}
                            >
                                <Share2 className="w-5 h-5" />
                                <span>Chia sẻ</span>
                            </button>

                            <button
                                onClick={onExport}
                                className="w-full flex items-center space-x-3 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={actionLoading}
                            >
                                <Download className="w-5 h-5" />
                                <span>Xuất file</span>
                            </button>

                            <hr className="my-4" />

                            {/* Status Actions */}
                            {plan.status === 'draft' && (
                                <button
                                    onClick={onActivate}
                                    className="w-full flex items-center space-x-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Play className="w-5 h-5" />
                                    )}
                                    <span>Kích hoạt</span>
                                </button>
                            )}

                            {plan.status === 'active' && (
                                <button
                                    onClick={onComplete}
                                    className="w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5" />
                                    )}
                                    <span>Hoàn thành</span>
                                </button>
                            )}

                            {plan.status !== 'archived' ? (
                                <button
                                    onClick={onArchive}
                                    className="w-full flex items-center space-x-3 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Archive className="w-5 h-5" />
                                    )}
                                    <span>Lưu trữ</span>
                                </button>
                            ) : (
                                <button
                                    onClick={onRestore}
                                    className="w-full flex items-center space-x-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-5 h-5" />
                                    )}
                                    <span>Khôi phục</span>
                                </button>
                            )}

                            <hr className="my-4" />

                            {/* Danger Zone */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-red-900 mb-3">Vùng nguy hiểm</h4>
                                <button
                                    onClick={onDelete}
                                    className="w-full flex items-center space-x-3 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                    <span>Xóa kế hoạch</span>
                                </button>
                            </div>

                            {/* Quick Stats */}
                            <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Thống kê nhanh</h4>
                                <div className="space-y-3">
                                    {plan.tasks && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Nhiệm vụ</span>
                                            <span className="text-sm font-medium text-gray-900">{plan.tasks.length}</span>
                                        </div>
                                    )}

                                    {plan.steps && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Bước thực hiện</span>
                                            <span className="text-sm font-medium text-gray-900">{plan.steps.length}</span>
                                        </div>
                                    )}

                                    {plan.risks && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Rủi ro</span>
                                            <span className="text-sm font-medium text-gray-900">{plan.risks.length}</span>
                                        </div>
                                    )}

                                    {plan.collaborators && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Cộng tác viên</span>
                                            <span className="text-sm font-medium text-gray-900">{plan.collaborators.length}</span>
                                        </div>
                                    )}

                                    {plan.tags && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Thẻ</span>
                                            <span className="text-sm font-medium text-gray-900">{plan.tags.length}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Share Info */}
                            {plan.shareSettings?.isPublic && plan.shareSettings?.shareLink && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Link chia sẻ</h4>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={plan.shareSettings.shareLink}
                                            readOnly
                                            className="flex-1 text-xs bg-white border border-blue-300 rounded px-2 py-1"
                                        />
                                        <button
                                            onClick={() => navigator.clipboard.writeText(plan.shareSettings?.shareLink || '')}
                                            className="p-1 text-blue-600 hover:text-blue-800"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

export default HistoryPlan;