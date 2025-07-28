import React, { useEffect, useState, useCallback } from 'react';
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
    PlanHistoryResponse
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
    Loader2
} from 'lucide-react';

// Interfaces
interface Plan {
    id: string;
    title: string;
    description?: string;
    category: string;
    status: 'draft' | 'active' | 'completed' | 'archived' | 'paused';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    source: 'manual' | 'ai-generated';
    createdAt: string;
    updatedAt: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
    tasks?: any[];
    collaborators?: any[];
    progress?: number | { totalTasks: number; completedTasks: number; percentage: number };
}

interface FilterState {
    search: string;
    category: string;
    status: string;
    priority: string;
    source: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const HistoryPlan: React.FC = () => {
    // States
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;

    // Filters
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        category: '',
        status: '',
        priority: '',
        source: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc'
    });

    // Fetch plans function
    const fetchPlans = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // ✅ FIX: Clean filters to remove empty strings
            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, string>);

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
            } else {
                setError(response.message || 'Không thể tải danh sách kế hoạch');
            }
        } catch (err: any) {
            console.error('Error fetching plans:', err);
            setError(err.message || 'Lỗi không xác định khi tải kế hoạch');
        } finally {
            setLoading(false);
        }
    }, [currentPage, filters]);

    // Effects
    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // Handle filter change
    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle search with debounce
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (filters.search !== '') {
                fetchPlans();
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [filters.search, fetchPlans]);

    // Plan actions
    const handleDeletePlan = async (planId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch này?')) return;

        try {
            setActionLoading(planId);
            const response = await deletePlan(planId);

            if (response.success) {
                setPlans(prev => prev.filter(plan => plan.id !== planId));
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
                fetchPlans(); // Refresh list
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
                fetchPlans(); // Refresh list
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
                fetchPlans(); // Refresh list
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
                fetchPlans(); // Refresh list
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
                fetchPlans(); // Refresh list
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

    const handleSharePlan = async (planId: string) => {
        try {
            setActionLoading(planId);
            const response = await sharePlan(planId, 'view');

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

            // Create download link
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

    // Utility functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // ✅ FIX: Helper function to get progress percentage
    const getProgressPercentage = (progress: number | { totalTasks: number; completedTasks: number; percentage: number } | undefined): number => {
        if (progress === undefined) return 0;
        if (typeof progress === 'number') return progress;
        if (typeof progress === 'object' && progress.percentage !== undefined) {
            return progress.percentage;
        }
        return 0;
    };

    // Render loading state
    if (loading && plans.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="flex items-center space-x-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tải danh sách kế hoạch...</span>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && plans.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchPlans}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch sử kế hoạch</h1>
                <p className="text-gray-600">Quản lý và theo dõi tất cả kế hoạch của bạn</p>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm kế hoạch..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Filter Toggle */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Bộ lọc</span>
                    </button>

                    <div className="text-sm text-gray-600">
                        Hiển thị {plans.length} / {totalItems} kế hoạch
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả danh mục</option>
                            <option value="personal">Cá nhân</option>
                            <option value="work">Công việc</option>
                            <option value="education">Giáo dục</option>
                            <option value="health">Sức khỏe</option>
                            <option value="finance">Tài chính</option>
                            <option value="travel">Du lịch</option>
                            <option value="other">Khác</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="draft">Nháp</option>
                            <option value="active">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="archived">Lưu trữ</option>
                            <option value="paused">Tạm dừng</option>
                        </select>

                        <select
                            value={filters.priority}
                            onChange={(e) => handleFilterChange('priority', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả độ ưu tiên</option>
                            <option value="urgent">Khẩn cấp</option>
                            <option value="high">Cao</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Thấp</option>
                        </select>

                        <select
                            value={filters.source}
                            onChange={(e) => handleFilterChange('source', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Tất cả nguồn</option>
                            <option value="ai-generated">AI tạo</option>
                            <option value="manual">Thủ công</option>
                        </select>

                        <select
                            value={`${filters.sortBy}-${filters.sortOrder}`}
                            onChange={(e) => {
                                const [sortBy, sortOrder] = e.target.value.split('-');
                                handleFilterChange('sortBy', sortBy);
                                handleFilterChange('sortOrder', sortOrder);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="updatedAt-desc">Mới nhất</option>
                            <option value="updatedAt-asc">Cũ nhất</option>
                            <option value="title-asc">Tên A-Z</option>
                            <option value="title-desc">Tên Z-A</option>
                            <option value="priority-desc">Ưu tiên cao</option>
                            <option value="priority-asc">Ưu tiên thấp</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Plans Grid */}
            {plans.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có kế hoạch nào</h3>
                    <p className="text-gray-600">Hãy tạo kế hoạch đầu tiên của bạn!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            {/* Plan Header */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3
                                        className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600"
                                        onClick={() => setSelectedPlan(plan)}
                                    >
                                        {plan.title}
                                    </h3>
                                    <div className="relative group">
                                        <button className="p-1 hover:bg-gray-100 rounded">
                                            {actionLoading === plan.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <MoreVertical className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => handleDuplicatePlan(plan.id, plan.title)}
                                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                    <span>Sao chép</span>
                                                </button>

                                                <button
                                                    onClick={() => handleSharePlan(plan.id)}
                                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                    <span>Chia sẻ</span>
                                                </button>

                                                <button
                                                    onClick={() => handleExportPlan(plan.id, 'json')}
                                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span>Xuất file</span>
                                                </button>

                                                <hr className="my-1" />

                                                {plan.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleActivatePlan(plan.id)}
                                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        <span>Kích hoạt</span>
                                                    </button>
                                                )}

                                                {plan.status === 'active' && (
                                                    <button
                                                        onClick={() => handleCompletePlan(plan.id)}
                                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Hoàn thành</span>
                                                    </button>
                                                )}

                                                {plan.status !== 'archived' ? (
                                                    <button
                                                        onClick={() => handleArchivePlan(plan.id)}
                                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                        <span>Lưu trữ</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRestorePlan(plan.id)}
                                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        <span>Khôi phục</span>
                                                    </button>
                                                )}

                                                <hr className="my-1" />

                                                <button
                                                    onClick={() => handleDeletePlan(plan.id)}
                                                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Xóa</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {plan.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
                                )}

                                {/* Status and Priority Badges */}
                                <div className="flex items-center space-x-2 mb-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                                        {plan.status === 'active' ? 'Đang thực hiện' :
                                            plan.status === 'completed' ? 'Hoàn thành' :
                                                plan.status === 'archived' ? 'Lưu trữ' :
                                                    plan.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(plan.priority)}`}>
                                        {plan.priority === 'urgent' ? 'Khẩn cấp' :
                                            plan.priority === 'high' ? 'Cao' :
                                                plan.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                    </span>
                                </div>
                            </div>

                            {/* Plan Details */}
                            <div className="p-4 space-y-3">
                                {/* Progress Bar */}
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

                                {/* Meta Information */}
                                <div className="space-y-2 text-xs text-gray-600">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>Tạo: {formatDate(plan.createdAt)}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-3 h-3" />
                                        <span>Cập nhật: {formatDate(plan.updatedAt)}</span>
                                    </div>

                                    {plan.source && (
                                        <div className="flex items-center space-x-2">
                                            <Tag className="w-3 h-3" />
                                            <span>{plan.source === 'ai-generated' ? 'AI tạo' : 'Thủ công'}</span>
                                        </div>
                                    )}

                                    {plan.tasks && (
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>{plan.tasks.length} nhiệm vụ</span>
                                        </div>
                                    )}

                                    {plan.collaborators && plan.collaborators.length > 0 && (
                                        <div className="flex items-center space-x-2">
                                            <User className="w-3 h-3" />
                                            <span>{plan.collaborators.length} cộng tác viên</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tags */}
                                {plan.tags && plan.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {plan.tags.slice(0, 3).map((tag, index) => (
                                            <span key={`${plan.id}-tag-${index}`} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        {plan.tags.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                +{plan.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Trước
                    </button>

                    <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                            return (
                                <button
                                    key={`page-${pageNum}`}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-2 rounded-lg ${currentPage === pageNum
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
                        className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                        Tiếp
                    </button>
                </div>
            )}

            {/* Plan Detail Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedPlan.title}</h2>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPlan.status)}`}>
                                            {selectedPlan.status === 'active' ? 'Đang thực hiện' :
                                                selectedPlan.status === 'completed' ? 'Hoàn thành' :
                                                    selectedPlan.status === 'archived' ? 'Lưu trữ' :
                                                        selectedPlan.status === 'paused' ? 'Tạm dừng' : 'Nháp'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedPlan.priority)}`}>
                                            {selectedPlan.priority === 'urgent' ? 'Khẩn cấp' :
                                                selectedPlan.priority === 'high' ? 'Cao' :
                                                    selectedPlan.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="space-y-6">
                                {selectedPlan.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mô tả</h3>
                                        <p className="text-gray-600">{selectedPlan.description}</p>
                                    </div>
                                )}

                                {/* Progress */}
                                {selectedPlan.progress !== undefined && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tiến độ</h3>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div
                                                className="bg-blue-600 h-4 rounded-full transition-all flex items-center justify-center text-white text-xs font-medium"
                                                style={{ width: `${getProgressPercentage(selectedPlan.progress)}%` }}
                                            >
                                                {getProgressPercentage(selectedPlan.progress)}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tasks */}
                                {selectedPlan.tasks && selectedPlan.tasks.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nhiệm vụ ({selectedPlan.tasks.length})</h3>
                                        <div className="space-y-2">
                                            {selectedPlan.tasks.slice(0, 5).map((task, index) => (
                                                <div key={`${selectedPlan.id}-task-${index}`} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm text-gray-700">{task.title || task.description || `Nhiệm vụ ${index + 1}`}</span>
                                                </div>
                                            ))}
                                            {selectedPlan.tasks.length > 5 && (
                                                <p className="text-sm text-gray-500">... và {selectedPlan.tasks.length - 5} nhiệm vụ khác</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Collaborators */}
                                {selectedPlan.collaborators && selectedPlan.collaborators.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cộng tác viên ({selectedPlan.collaborators.length})</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPlan.collaborators.map((collaborator, index) => (
                                                <div key={`${selectedPlan.id}-collaborator-${index}`} className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm text-gray-700">{collaborator.name || collaborator.email || `Cộng tác viên ${index + 1}`}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {selectedPlan.tags && selectedPlan.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Thẻ</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedPlan.tags.map((tag, index) => (
                                                <span key={`${selectedPlan.id}-modal-tag-${index}`} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Thông tin</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Ngày tạo: {formatDate(selectedPlan.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Cập nhật: {formatDate(selectedPlan.updatedAt)}</span>
                                        </div>
                                        {selectedPlan.startDate && (
                                            <div className="flex items-center space-x-2">
                                                <Play className="w-4 h-4" />
                                                <span>Bắt đầu: {formatDate(selectedPlan.startDate)}</span>
                                            </div>
                                        )}
                                        {selectedPlan.endDate && (
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Kết thúc: {formatDate(selectedPlan.endDate)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <Tag className="w-4 h-4" />
                                            <span>Danh mục: {selectedPlan.category}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>Nguồn: {selectedPlan.source === 'ai-generated' ? 'AI tạo' : 'Thủ công'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    <button
                                        onClick={() => handleDuplicatePlan(selectedPlan.id, selectedPlan.title)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        disabled={actionLoading === selectedPlan.id}
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>Sao chép</span>
                                    </button>

                                    <button
                                        onClick={() => handleSharePlan(selectedPlan.id)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        disabled={actionLoading === selectedPlan.id}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>Chia sẻ</span>
                                    </button>

                                    <button
                                        onClick={() => handleExportPlan(selectedPlan.id, 'json')}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                        disabled={actionLoading === selectedPlan.id}
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Xuất file</span>
                                    </button>

                                    {selectedPlan.status === 'draft' && (
                                        <button
                                            onClick={() => handleActivatePlan(selectedPlan.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            disabled={actionLoading === selectedPlan.id}
                                        >
                                            <Play className="w-4 h-4" />
                                            <span>Kích hoạt</span>
                                        </button>
                                    )}

                                    {selectedPlan.status === 'active' && (
                                        <button
                                            onClick={() => handleCompletePlan(selectedPlan.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            disabled={actionLoading === selectedPlan.id}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Hoàn thành</span>
                                        </button>
                                    )}

                                    {selectedPlan.status !== 'archived' ? (
                                        <button
                                            onClick={() => handleArchivePlan(selectedPlan.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                            disabled={actionLoading === selectedPlan.id}
                                        >
                                            <Archive className="w-4 h-4" />
                                            <span>Lưu trữ</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRestorePlan(selectedPlan.id)}
                                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            disabled={actionLoading === selectedPlan.id}
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>Khôi phục</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeletePlan(selectedPlan.id)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        disabled={actionLoading === selectedPlan.id}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Xóa</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPlan;
