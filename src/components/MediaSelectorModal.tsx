import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  restaurantId: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({ isOpen, onClose, onSelect, restaurantId }) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (isOpen && restaurantId) {
      fetchMedia();
    }
  }, [isOpen, restaurantId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const [menuItemsResult, storefrontResult] = await Promise.all([
        supabase.storage
          .from('menu_items')
          .list(restaurantId, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          }),
        supabase.storage
          .from('menu_items')
          .list(`storefront/${restaurantId}`, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          })
      ]);

      if (menuItemsResult.error) throw menuItemsResult.error;
      if (storefrontResult.error) throw storefrontResult.error;

      const menuFiles = (menuItemsResult.data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ ...f, folderPath: restaurantId }));
      const storefrontFiles = (storefrontResult.data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({ ...f, folderPath: `storefront/${restaurantId}` }));

      const allFiles = [...menuFiles, ...storefrontFiles].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFiles(allFiles);
    } catch (err: any) {
      console.error('Error fetching media:', err);
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurantId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${restaurantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu_items')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu_items')
        .getPublicUrl(filePath);

      toast.success(
        <span className="text-[8px] font-bold uppercase tracking-widest">Image Uploaded</span>,
        { duration: 1500 }
      );
      onSelect(publicUrl);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = (file: any) => {
    const { data: { publicUrl } } = supabase.storage
      .from('menu_items')
      .getPublicUrl(`${file.folderPath}/${file.name}`);
    
    onSelect(publicUrl);
    onClose();
  };

  const totalPages = Math.ceil(files.length / itemsPerPage);
  const paginatedFiles = files.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Select Image</h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('library')}
              className={cn(
                "flex-1 py-3 text-sm font-bold transition-colors border-b-2",
                activeTab === 'library' ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={cn(
                "flex-1 py-3 text-sm font-bold transition-colors border-b-2",
                activeTab === 'upload' ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              Upload New
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {activeTab === 'library' ? (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm font-medium">Loading media...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">No images found in library</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {paginatedFiles.map((file) => {
                        const { data: { publicUrl } } = supabase.storage
                          .from('menu_items')
                          .getPublicUrl(`${file.folderPath}/${file.name}`);
                        
                        return (
                          <div 
                            key={file.id}
                            onClick={() => handleSelectImage(file)}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:border-brand-500 transition-all"
                          >
                            <img 
                              src={publicUrl} 
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors" />
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                        <p className="text-xs font-medium text-slate-500">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, files.length)} of {files.length}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-700 px-2">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <label className="cursor-pointer flex flex-col items-center gap-4 text-slate-400 hover:text-brand-600 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold block mb-1">Click to browse files</span>
                    <span className="text-xs font-medium text-slate-500">JPG, PNG or WebP (max 2MB)</span>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleUpload} 
                    disabled={isUploading}
                  />
                </label>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
