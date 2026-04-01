"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Menu, ChevronDown, User, LogOut, UserCircle, X, Upload, Calendar, DollarSign, Mail, Hash, ZoomIn, ZoomOut, Move, Check, Pencil } from "lucide-react";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover } from "react-aria-components";
import { ProductsDropdownMenu } from "@/components/marketing/header-navigation/products-dropdown-menu";
import { cx } from "@/utils/cx";

interface DealerNavProps {
    dealerLogo?: string | null;
    originalLogoUrl?: string | null;
    dealerName?: string;
    userEmail?: string;
    userId?: string;
    pricePerLaborHour?: number | null;
    qrCodeUrl?: string | null;
    createdAt?: string;
    onProfileUpdate?: (data: { logoUrl?: string; originalLogoUrl?: string; pricePerLaborHour?: number; qrCodeUrl?: string }) => void;
}

const API_BASE = process.env.NODE_ENV === 'production' 
    ? "https://api.vintraxx.com/api/v1" 
    : "http://localhost:3000/api/v1";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { logoUrl?: string; originalLogoUrl?: string; pricePerLaborHour?: number; qrCodeUrl?: string; password?: string }) => Promise<void>;
    userId?: string;
    userEmail?: string;
    pricePerLaborHour?: number | null;
    logoUrl?: string | null;
    originalLogoUrl?: string | null;
    qrCodeUrl?: string | null;
    createdAt?: string;
}

// Image Crop Editor Modal - Freelansite style
const ImageCropEditor = ({ 
    originalImage, 
    onApply, 
    onCancel, 
    onChangeImage 
}: { 
    originalImage: string; 
    onApply: (croppedImage: string) => void; 
    onCancel: () => void;
    onChangeImage: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, size: 120 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState({ width: 250, height: 250 });

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            // Calculate display size (fit within 250x250 container)
            const maxSize = 250;
            let displayWidth = img.width;
            let displayHeight = img.height;
            
            if (img.width > maxSize || img.height > maxSize) {
                const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                displayWidth = img.width * ratio;
                displayHeight = img.height * ratio;
            }
            
            setImageSize({ width: displayWidth, height: displayHeight });
            setContainerSize({ width: displayWidth, height: displayHeight });
            
            // Initialize crop box centered
            const initialSize = Math.min(displayWidth, displayHeight, 120);
            setCropBox({
                x: (displayWidth - initialSize) / 2,
                y: (displayHeight - initialSize) / 2,
                size: initialSize
            });
        };
        img.src = originalImage;
    }, [originalImage]);

    const handleMouseDown = (e: React.MouseEvent, action: 'drag' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();
        if (action === 'drag') {
            setIsDragging(true);
        } else {
            setIsResizing(true);
        }
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging && !isResizing) return;
        
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        if (isDragging) {
            setCropBox(prev => ({
                ...prev,
                x: Math.max(0, Math.min(containerSize.width - prev.size, prev.x + dx)),
                y: Math.max(0, Math.min(containerSize.height - prev.size, prev.y + dy))
            }));
        } else if (isResizing) {
            setCropBox(prev => {
                const delta = Math.max(dx, dy);
                const newSize = Math.max(50, Math.min(
                    Math.min(containerSize.width - prev.x, containerSize.height - prev.y),
                    prev.size + delta
                ));
                return { ...prev, size: newSize };
            });
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
    }, [isDragging, isResizing, dragStart, containerSize]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
    }, []);

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    const applyCrop = () => {
        if (!canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Calculate the crop area in original image coordinates
            const scaleX = img.width / imageSize.width;
            const scaleY = img.height / imageSize.height;
            
            const sourceX = cropBox.x * scaleX;
            const sourceY = cropBox.y * scaleY;
            const sourceSize = cropBox.size * Math.max(scaleX, scaleY);
            
            // Output to 200x200 canvas
            const outputSize = 200;
            canvas.width = outputSize;
            canvas.height = outputSize;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputSize, outputSize);

            ctx.drawImage(
                img,
                sourceX, sourceY, sourceSize, sourceSize,
                0, 0, outputSize, outputSize
            );

            const croppedDataUrl = canvas.toDataURL('image/png');
            onApply(croppedDataUrl);
        };
        img.src = originalImage;
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
            
            <div className="relative bg-[#2a3441] rounded-xl shadow-2xl p-6 mx-4 max-w-sm w-full">
                <button
                    onClick={onCancel}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4 text-white/70" />
                </button>
                
                <h3 className="text-lg font-semibold text-white mb-1">Edit profile picture</h3>
                <p className="text-sm text-white/60 mb-4">Max. of 5MB. Recommended size: 200px x 200px</p>
                
                {/* Image with crop box overlay */}
                <div 
                    ref={containerRef}
                    className="relative mx-auto bg-slate-800 rounded-lg overflow-hidden"
                    style={{ width: containerSize.width, height: containerSize.height }}
                >
                    <img 
                        src={originalImage} 
                        alt="Edit" 
                        className="w-full h-full object-contain"
                        draggable={false}
                    />
                    
                    {/* Dark overlay outside crop area */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Top overlay */}
                        <div className="absolute bg-black/50" style={{ top: 0, left: 0, right: 0, height: cropBox.y }} />
                        {/* Bottom overlay */}
                        <div className="absolute bg-black/50" style={{ bottom: 0, left: 0, right: 0, top: cropBox.y + cropBox.size }} />
                        {/* Left overlay */}
                        <div className="absolute bg-black/50" style={{ top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.size }} />
                        {/* Right overlay */}
                        <div className="absolute bg-black/50" style={{ top: cropBox.y, right: 0, left: cropBox.x + cropBox.size, height: cropBox.size }} />
                    </div>
                    
                    {/* Crop box */}
                    <div 
                        className="absolute border-2 border-dashed border-white cursor-move"
                        style={{
                            left: cropBox.x,
                            top: cropBox.y,
                            width: cropBox.size,
                            height: cropBox.size,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'drag')}
                    >
                        {/* Corner handles */}
                        <div 
                            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-white border border-slate-400 cursor-se-resize"
                            onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        />
                        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-white border border-slate-400" />
                        <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-white border border-slate-400" />
                        <div className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-white border border-slate-400" />
                    </div>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="mt-5 space-y-3">
                    <button
                        onClick={applyCrop}
                        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Set as profile picture
                    </button>
                    <button
                        onClick={onChangeImage}
                        className="w-full py-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                        Change picture
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProfileModal = ({ isOpen, onClose, onSave, userId, userEmail, pricePerLaborHour, logoUrl, originalLogoUrl, qrCodeUrl, createdAt }: ProfileModalProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeInputRef = useRef<HTMLInputElement>(null);
    const [saving, setSaving] = useState(false);
    const [editedLaborRate, setEditedLaborRate] = useState<string>(pricePerLaborHour?.toString() || "");
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [selectedOriginalImage, setSelectedOriginalImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [showCropEditor, setShowCropEditor] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [newQrCode, setNewQrCode] = useState<string | null>(null);
    const [qrCodePassword, setQrCodePassword] = useState("");
    const [showQrPasswordInput, setShowQrPasswordInput] = useState(false);
    const [qrCodeError, setQrCodeError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setEditedLaborRate(pricePerLaborHour?.toString() || "");
            setCroppedImage(null);
            setOriginalImage(null);
            setSelectedOriginalImage(null);
            setShowCropEditor(false);
            setHasChanges(false);
            setNewQrCode(null);
            setQrCodePassword("");
            setShowQrPasswordInput(false);
            setQrCodeError("");
        }
    }, [isOpen, pricePerLaborHour]);

    useEffect(() => {
        const laborRateChanged = editedLaborRate !== (pricePerLaborHour?.toString() || "");
        const logoChanged = croppedImage !== null;
        const qrCodeChanged = newQrCode !== null;
        setHasChanges(laborRateChanged || logoChanged || qrCodeChanged);
    }, [editedLaborRate, pricePerLaborHour, croppedImage, newQrCode]);

    if (!isOpen) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Logo file must be less than 5MB.");
            return;
        }

        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        
        setOriginalImage(base64);
        setSelectedOriginalImage(base64);
        setShowCropEditor(true);
    };

    const handleCropApply = (croppedDataUrl: string) => {
        setCroppedImage(croppedDataUrl);
        setShowCropEditor(false);
        setOriginalImage(null);
    };

    const handleEditClick = () => {
        // Use the original unedited logo from backend if available, otherwise use current logo
        const imageForEditing = originalLogoUrl || selectedOriginalImage || croppedImage || logoUrl;
        if (imageForEditing) {
            setOriginalImage(imageForEditing);
            setShowCropEditor(true);
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleQrCodeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setQrCodeError("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setQrCodeError("QR code file must be less than 5MB.");
            return;
        }

        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        
        setNewQrCode(base64);
        setShowQrPasswordInput(true);
        setQrCodeError("");
    };

    const handleSave = async () => {
        // Validate QR code password if QR code is being changed
        if (newQrCode && !qrCodePassword.trim()) {
            setQrCodeError("Password is required to update QR code.");
            return;
        }

        setSaving(true);
        setQrCodeError("");
        try {
            const updateData: { logoUrl?: string; originalLogoUrl?: string; pricePerLaborHour?: number; qrCodeUrl?: string; password?: string } = {};
            
            if (croppedImage) {
                updateData.logoUrl = croppedImage;
                // Include the original unedited image if a new image was selected
                if (selectedOriginalImage) {
                    updateData.originalLogoUrl = selectedOriginalImage;
                }
            }
            
            const parsedRate = parseFloat(editedLaborRate);
            if (!isNaN(parsedRate) && parsedRate > 0 && parsedRate !== pricePerLaborHour) {
                updateData.pricePerLaborHour = parsedRate;
            }

            if (newQrCode) {
                updateData.qrCodeUrl = newQrCode;
                updateData.password = qrCodePassword;
            }

            if (Object.keys(updateData).length > 0) {
                await onSave(updateData);
            }
            onClose();
        } catch (error: any) {
            if (error.message?.includes("password") || error.message?.includes("Invalid")) {
                setQrCodeError(error.message || "Invalid password. Please try again.");
            } else {
                alert("Failed to save changes. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedLaborRate(pricePerLaborHour?.toString() || "");
        setCroppedImage(null);
        setOriginalImage(null);
        setSelectedOriginalImage(null);
        setShowCropEditor(false);
        setNewQrCode(null);
        setQrCodePassword("");
        setShowQrPasswordInput(false);
        setQrCodeError("");
        onClose();
    };

    const displayQrCode = newQrCode || qrCodeUrl;

    const displayLogo = croppedImage || logoUrl;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
            
            {/* Crop Editor Modal */}
            {showCropEditor && originalImage && (
                <ImageCropEditor
                    originalImage={originalImage}
                    onApply={handleCropApply}
                    onCancel={() => {
                        setShowCropEditor(false);
                        setOriginalImage(null);
                    }}
                    onChangeImage={() => fileInputRef.current?.click()}
                />
            )}
            
            <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="relative bg-gradient-to-br from-[#1B3A5F] to-[#2d5278] px-6 py-8">
                    <button
                        onClick={handleCancel}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center border-2 border-white/20">
                                {displayLogo ? (
                                    <img src={displayLogo} alt="Dealer Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className="w-12 h-12 text-white/50" />
                                )}
                            </div>
                            {/* Edit icon - bottom right corner */}
                            <button
                                onClick={handleEditClick}
                                className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-700 hover:bg-slate-600 border-2 border-white rounded-lg flex items-center justify-center transition-colors shadow-lg"
                            >
                                <Pencil className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                        <p className="mt-3 text-sm text-white/70">Click edit icon to change logo</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="px-6 py-6 space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Profile Details</h2>
                    
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">User ID</p>
                            <p className="text-sm font-mono text-slate-900 truncate">{userId || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email Address</p>
                            <p className="text-sm text-slate-900 truncate">{userEmail || "—"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Labor Hourly Rate</p>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">$</span>
                                <input
                                    type="number"
                                    value={editedLaborRate}
                                    onChange={(e) => setEditedLaborRate(e.target.value)}
                                    placeholder="Enter rate"
                                    className="flex-1 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-slate-500 text-sm">/hr</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account Created</p>
                            <p className="text-sm text-slate-900">{formatDate(createdAt)}</p>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                                {displayQrCode ? (
                                    <img src={displayQrCode} alt="QR Code" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">QR Code</p>
                                <p className="text-xs text-slate-500 mb-2">Used in OBD scan reports</p>
                                <input
                                    ref={qrCodeInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleQrCodeSelect}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => qrCodeInputRef.current?.click()}
                                    className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer"
                                >
                                    {displayQrCode ? "Change QR code" : "Upload QR code"}
                                </button>
                            </div>
                        </div>
                        
                        {/* Password input for QR code change */}
                        {showQrPasswordInput && newQrCode && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs text-amber-800 mb-2 font-medium">
                                    Password required to change QR code
                                </p>
                                <input
                                    type="password"
                                    value={qrCodePassword}
                                    onChange={(e) => setQrCodePassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full text-sm bg-white border border-amber-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                                {qrCodeError && (
                                    <p className="text-xs text-red-600 mt-1">{qrCodeError}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex-1 py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="flex-1 py-2.5 px-4 bg-[#1B3A5F] hover:bg-[#2d5278] text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserDropdownMenu = ({ className, userEmail, onProfileClick, onClose }: { className?: string; userEmail?: string; onProfileClick: () => void; onClose?: () => void }) => {
    return (
        <div className={cx(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border text-popover-foreground shadow-md w-64 bg-white border-slate-200 p-2",
            className
        )}>
            <div className="px-3 py-2 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-900">{userEmail?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-slate-500">{userEmail || 'user@example.com'}</p>
            </div>
            <div className="py-1">
                <button 
                    onClick={() => {
                        onClose?.();
                        onProfileClick();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                    <UserCircle className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Profile</span>
                </button>
            </div>
            <div role="separator" aria-orientation="horizontal" className="-mx-1 my-1 h-px bg-slate-200" />
            <div className="py-1">
                <button 
                    onClick={() => {
                        localStorage.removeItem('dealer_token');
                        localStorage.removeItem('dealer_user');
                        window.location.href = '/login';
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 cursor-pointer text-red-600"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                </button>
            </div>
        </div>
    );
};

export const DealerNav = ({ dealerLogo, originalLogoUrl, dealerName, userEmail, userId, pricePerLaborHour, qrCodeUrl, createdAt, onProfileUpdate }: DealerNavProps) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentLogo, setCurrentLogo] = useState(dealerLogo);
    const [currentOriginalLogo, setCurrentOriginalLogo] = useState(originalLogoUrl);
    const [currentLaborRate, setCurrentLaborRate] = useState(pricePerLaborHour);
    const [currentQrCode, setCurrentQrCode] = useState(qrCodeUrl);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentLogo(dealerLogo);
    }, [dealerLogo]);

    useEffect(() => {
        setCurrentOriginalLogo(originalLogoUrl);
    }, [originalLogoUrl]);

    useEffect(() => {
        setCurrentLaborRate(pricePerLaborHour);
    }, [pricePerLaborHour]);

    useEffect(() => {
        setCurrentQrCode(qrCodeUrl);
    }, [qrCodeUrl]);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleProfileSave = async (data: { logoUrl?: string; originalLogoUrl?: string; pricePerLaborHour?: number; qrCodeUrl?: string; password?: string }) => {
        const token = localStorage.getItem("dealer_token");
        const res = await fetch(`${API_BASE}/dealer/profile`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                logoImage: data.logoUrl,
                originalLogoImage: data.originalLogoUrl,
                pricePerLaborHour: data.pricePerLaborHour,
                qrCodeImage: data.qrCodeUrl,
                password: data.password
            }),
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update profile");
        }
        
        const result = await res.json();
        if (data.logoUrl) {
            setCurrentLogo(data.logoUrl);
        }
        if (data.originalLogoUrl) {
            setCurrentOriginalLogo(data.originalLogoUrl);
        }
        if (data.pricePerLaborHour) {
            setCurrentLaborRate(data.pricePerLaborHour);
        }
        if (data.qrCodeUrl) {
            setCurrentQrCode(data.qrCodeUrl);
        }
        
        // Update localStorage
        const storedUser = localStorage.getItem("dealer_user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (data.logoUrl) user.logoUrl = data.logoUrl;
            if (data.originalLogoUrl) user.originalLogoUrl = data.originalLogoUrl;
            if (data.pricePerLaborHour) user.pricePerLaborHour = data.pricePerLaborHour;
            if (data.qrCodeUrl) user.qrCodeUrl = data.qrCodeUrl;
            localStorage.setItem("dealer_user", JSON.stringify(user));
        }
        
        onProfileUpdate?.(data);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        // Clear previous highlights
        const existingMarks = document.querySelectorAll('mark.search-highlight');
        existingMarks.forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            }
        });

        // Find and highlight matches
        const mainContent = document.querySelector('main');
        if (mainContent) {
            highlightText(mainContent, searchQuery.trim());
            
            // Scroll to first match
            const firstMatch = document.querySelector('mark.search-highlight');
            if (firstMatch) {
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    const highlightText = (element: Element, query: string) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
        const textNodes: Text[] = [];
        
        while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            if (node.textContent && node.textContent.toLowerCase().includes(query.toLowerCase())) {
                textNodes.push(node);
            }
        }
        
        textNodes.forEach(textNode => {
            const text = textNode.textContent || '';
            const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            const parts = text.split(regex);
            
            if (parts.length > 1) {
                const fragment = document.createDocumentFragment();
                parts.forEach(part => {
                    if (part.toLowerCase() === query.toLowerCase()) {
                        const mark = document.createElement('mark');
                        mark.className = 'search-highlight bg-yellow-300 px-0.5 rounded';
                        mark.textContent = part;
                        fragment.appendChild(mark);
                    } else {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });
                textNode.parentNode?.replaceChild(fragment, textNode);
            }
        });
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
        setSearchQuery("");
        // Clear highlights
        const existingMarks = document.querySelectorAll('mark.search-highlight');
        existingMarks.forEach(mark => {
            const parent = mark.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
                parent.normalize();
            }
        });
    };

    return (
        <>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200">
            <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Dealer Logo */}
                    <Link href="/VinTraxxSmartScanDashboard" className="flex items-center gap-3 group">
                        {currentLogo && (
                            <img 
                                src={currentLogo} 
                                alt={dealerName || "Dealer"} 
                                className="h-12 rounded-lg object-cover"
                            />
                        )}
                        {dealerName && (
                            <span className="hidden lg:block text-lg font-bold text-[#1B3A5F]">
                                {dealerName}
                            </span>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1">
                        <AriaDialogTrigger>
                            <AriaButton className="flex cursor-pointer items-center gap-0.5 rounded-lg px-1.5 py-1 text-md font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:text-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2">
                                <span className="px-0.5">Products</span>
                                <ChevronDown className="size-4 rotate-0 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear in-aria-expanded:-rotate-180" />
                            </AriaButton>

                            <AriaPopover
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "hidden origin-top will-change-transform md:block",
                                        isEntering && "duration-200 ease-out animate-in fade-in slide-in-from-top-1",
                                        isExiting && "duration-150 ease-in animate-out fade-out slide-out-to-top-1",
                                    )
                                }
                                offset={8}
                                containerPadding={0}
                            >
                                {({ isEntering, isExiting }) => (
                                    <AriaDialog
                                        className={cx(
                                            "mx-auto origin-top outline-hidden",
                                            // Have to use the scale animation inside the popover to avoid
                                            // miscalculating the popover's position when opening.
                                            isEntering && "duration-200 ease-out animate-in zoom-in-95",
                                            isExiting && "duration-150 ease-in animate-out zoom-out-95",
                                        )}
                                    >
                                        <ProductsDropdownMenu />
                                    </AriaDialog>
                                )}
                            </AriaPopover>
                        </AriaDialogTrigger>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Search (desktop only) */}
                        <div className="hidden md:flex items-center">
                            <div className="relative flex items-center">
                                <div className={cx(
                                    "flex items-center transition-all duration-300 ease-in-out overflow-hidden",
                                    isSearchOpen ? "w-64" : "w-9"
                                )}>
                                    {isSearchOpen ? (
                                        <form onSubmit={handleSearch} className="flex items-center w-full">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search this page..."
                                                className="w-full h-9 pl-9 pr-8 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                            />
                                            <Search className="absolute left-2.5 w-4 h-4 text-slate-400" />
                                            <button
                                                type="button"
                                                onClick={closeSearch}
                                                className="absolute right-2 p-0.5 rounded hover:bg-slate-200"
                                            >
                                                <X className="w-4 h-4 text-slate-500" />
                                            </button>
                                        </form>
                                    ) : (
                                        <button 
                                            onClick={() => setIsSearchOpen(true)}
                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent h-9 w-9 text-slate-600 hover:text-slate-900"
                                        >
                                            <Search className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* User menu */}
                        <AriaDialogTrigger isOpen={isUserPopoverOpen} onOpenChange={setIsUserPopoverOpen}>
                            <AriaButton className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-md font-semibold text-secondary outline-focus-ring transition duration-100 ease-linear hover:text-secondary_hover hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2">
                                <div className="relative flex shrink-0 overflow-hidden rounded-full w-8 h-8">
                                    <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 text-white text-sm">
                                        {userEmail?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <span className="hidden sm:inline text-sm">{userEmail?.split('@')[0] || 'user'}</span>
                                <ChevronDown className="size-4 rotate-0 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear in-aria-expanded:-rotate-180" />
                            </AriaButton>

                            <AriaPopover
                                className={({ isEntering, isExiting }) =>
                                    cx(
                                        "hidden origin-top will-change-transform md:block",
                                        isEntering && "duration-200 ease-out animate-in fade-in slide-in-from-top-1",
                                        isExiting && "duration-150 ease-in animate-out fade-out slide-out-to-top-1",
                                    )
                                }
                                offset={8}
                                containerPadding={0}
                            >
                                {({ isEntering, isExiting }) => (
                                    <AriaDialog
                                        className={cx(
                                            "mx-auto origin-top outline-hidden",
                                            isEntering && "duration-200 ease-out animate-in zoom-in-95",
                                            isExiting && "duration-150 ease-in animate-out zoom-out-95",
                                        )}
                                    >
                                        <UserDropdownMenu 
                                            userEmail={userEmail} 
                                            onProfileClick={() => setIsProfileModalOpen(true)} 
                                            onClose={() => setIsUserPopoverOpen(false)}
                                        />
                                    </AriaDialog>
                                )}
                            </AriaPopover>
                        </AriaDialogTrigger>

                        {/* Mobile menu toggle */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-9 lg:hidden text-slate-600"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {/* Products Dropdown */}
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-md font-semibold text-primary hover:bg-primary_hover rounded-lg"
                                >
                                    Products
                                    <ChevronDown
                                        className={cx("size-4 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear", isProductsDropdownOpen ? "-rotate-180" : "rotate-0")}
                                    />
                                </button>
                                {isProductsDropdownOpen && <div className="mt-1"><ProductsDropdownMenu /></div>}
                            </div>
                            
                            {/* User Dropdown */}
                            <div className="flex flex-col gap-0.5">
                                <button
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-md font-semibold text-primary hover:bg-primary_hover rounded-lg"
                                >
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Account
                                    </div>
                                    <ChevronDown
                                        className={cx("size-4 stroke-[2.625px] text-fg-quaternary transition duration-100 ease-linear", isUserDropdownOpen ? "-rotate-180" : "rotate-0")}
                                    />
                                </button>
                                {isUserDropdownOpen && <div className="mt-1"><UserDropdownMenu userEmail={userEmail} onProfileClick={() => setIsProfileModalOpen(true)} onClose={() => { setIsUserDropdownOpen(false); setIsMobileMenuOpen(false); }} /></div>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleProfileSave}
                userId={userId}
                userEmail={userEmail}
                pricePerLaborHour={currentLaborRate}
                logoUrl={currentLogo}
                originalLogoUrl={currentOriginalLogo}
                qrCodeUrl={currentQrCode}
                createdAt={createdAt}
            />
        </>
    );
};
