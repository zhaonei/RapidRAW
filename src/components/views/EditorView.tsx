import { type RefObject, type PointerEvent as ReactPointerEvent, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronUp } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

import Editor from '../panel/Editor';
import BottomBar from '../panel/BottomBar';
import Resizer from '../ui/Resizer';
import MobileDrawer from '../panel/MobileDrawer';
import { MobilePanelSwitcher, PANEL_TITLES, PANEL_ICONS } from '../panel/PanelSwitcher';
import { useContainerSize } from '../../hooks/useContainerSize';

import { useEditorStore } from '../../store/useEditorStore';
import { isFilmstripDocked, useUIStore } from '../../store/useUIStore';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useProcessStore } from '../../store/useProcessStore';
import { getImageFlag } from '../../utils/imageFlags';

import { ImageFile } from '../../types/library';
import { Orientation, Panel } from '../../types/ui';
import { ThumbnailAspectRatio } from '../../types/settings';

interface EditorViewProps {
  transformWrapperRef: RefObject<any>;
  isResizing: boolean;
  layoutMode: 'compact' | 'wide' | 'full';
  isAndroid: boolean;
  compactEditorPanelHeight: number;
  compactEditorPanelCollapsedHeight: number;
  thumbnailAspectRatio: ThumbnailAspectRatio;
  sortedImageList: ImageFile[];
  createResizeHandler: (stateKey: string, startSize: number) => (e: ReactPointerEvent<HTMLDivElement>) => void;
  createResizeResetHandler: (stateKey: string) => () => void;
  handleBackToLibrary: () => void;
  handleEditorContextMenu: (...args: any) => void;
  handleThumbnailContextMenu: (...args: any) => void;
  handleMainLibraryContextMenu?: (...args: any) => void;
  handleImageClick: (...args: any) => void;
  handleClearSelection: () => void;
  handleCopyAdjustments: () => void;
  handlePasteAdjustments: () => void;
  handleRate: (...args: any) => void;
  handleZoomChange: (zoom: number) => void;
  handlePanelSelect: (panelId: any) => void;
  requestThumbnails: any;
  renderAppPanel: (panelId: any) => React.ReactNode;
}

function FilmstripDropzone({ height }: { height: number }) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: 'layout-bottom', data: { type: 'layout-bottom' } });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx(
        'absolute inset-x-0 bottom-0 z-30 rounded-lg border-2 flex items-center justify-center transition-all duration-200 backdrop-blur-sm overflow-hidden',
        isOver
          ? 'scale-[0.98] border-transparent bg-accent/20 text-accent font-semibold'
          : 'border-dashed border-accent/40 bg-bg-secondary/60 text-text-secondary',
      )}
      style={{ height }}
    >
      <span className="text-xs uppercase tracking-wider pointer-events-none">
        {t('editor.switcher.tooltips.filmstrip')}
      </span>
    </motion.div>
  );
}

export default function EditorView({
  transformWrapperRef,
  isResizing,
  layoutMode,
  isAndroid,
  compactEditorPanelHeight,
  compactEditorPanelCollapsedHeight,
  thumbnailAspectRatio,
  sortedImageList,
  createResizeHandler,
  createResizeResetHandler,
  handleBackToLibrary,
  handleEditorContextMenu,
  handleThumbnailContextMenu,
  handleMainLibraryContextMenu,
  handleImageClick,
  handleClearSelection,
  handleCopyAdjustments,
  handlePasteAdjustments,
  handleRate,
  handleZoomChange,
  handlePanelSelect,
  requestThumbnails,
  renderAppPanel,
}: EditorViewProps) {
  const { t } = useTranslation();
  const { selectedImage } = useEditorStore(
    useShallow((state) => ({
      selectedImage: state.selectedImage,
    })),
  );

  const {
    isFullScreen,
    isInstantTransition,
    uiVisibility,
    bottomPanelHeight,
    activePanel,
    isFilmstripInSidePanel,
    isDraggingFilmstrip,
    setUI,
  } = useUIStore(
    useShallow((state) => ({
      isFullScreen: state.isFullScreen,
      isInstantTransition: state.isInstantTransition,
      uiVisibility: state.uiVisibility,
      bottomPanelHeight: state.bottomPanelHeight,
      activePanel: state.activePanel,
      isFilmstripInSidePanel: layoutMode === 'full' && isFilmstripDocked(state),
      isDraggingFilmstrip: state.activeLayoutDragItem === Panel.Filmstrip,
      setUI: state.setUI,
    })),
  );

  const { multiSelectedPaths, imageRatings, flag, isViewLoading } = useLibraryStore(
    useShallow((state) => ({
      multiSelectedPaths: state.multiSelectedPaths,
      imageRatings: state.imageRatings,
      flag: getImageFlag(state.imageList, selectedImage?.path),
      isViewLoading: state.isViewLoading,
    })),
  );

  const { isCopied, isPasted } = useProcessStore(
    useShallow((state) => ({
      isCopied: state.isCopied,
      isPasted: state.isPasted,
    })),
  );

  const editorNode = (
    <Editor
      onBackToLibrary={handleBackToLibrary}
      onContextMenu={handleEditorContextMenu}
      onImageSelect={handleImageClick}
      transformWrapperRef={transformWrapperRef}
    />
  );

  const editorBottomBarComponent = (
    <BottomBar
      filmstripHeight={bottomPanelHeight}
      imageList={sortedImageList}
      imageRatings={imageRatings}
      isCopied={isCopied}
      isCopyDisabled={!selectedImage}
      isFilmstripVisible={uiVisibility.filmstrip}
      isLoading={isViewLoading}
      isPasted={isPasted}
      isPasteDisabled={useEditorStore.getState().copiedAdjustments === null}
      isRatingDisabled={!selectedImage}
      isResizing={isResizing}
      multiSelectedPaths={multiSelectedPaths}
      onClearSelection={handleClearSelection}
      onContextMenu={handleThumbnailContextMenu}
      onEmptyAreaContextMenu={handleMainLibraryContextMenu}
      onCopy={handleCopyAdjustments}
      onOpenCopyPasteSettings={() => setUI({ isCopyPasteSettingsModalOpen: true })}
      onImageSelect={handleImageClick}
      onPaste={() => handlePasteAdjustments()}
      onRate={handleRate}
      onRequestThumbnails={requestThumbnails}
      onZoomChange={handleZoomChange}
      rating={imageRatings[selectedImage?.path || ''] || 0}
      flag={flag}
      selectedImage={selectedImage ?? undefined}
      showFilmstrip={layoutMode !== 'compact'}
      layoutMode={layoutMode}
      showZoomControls={!isAndroid}
      thumbnailAspectRatio={thumbnailAspectRatio}
      totalImages={sortedImageList.length}
    />
  );

  const editorBottomBarNode = (
    <div
      className={clsx(
        'flex flex-col w-full overflow-hidden shrink-0',
        !isResizing && !isInstantTransition && 'transition-all duration-300 ease-in-out',
      )}
      style={{
        maxHeight: isFullScreen ? '0px' : '500px',
        opacity: isFullScreen ? 0 : 1,
      }}
    >
      {layoutMode !== 'compact' &&
        (isFilmstripInSidePanel ? (
          <div className="h-2 shrink-0" />
        ) : (
          <Resizer
            direction={Orientation.Horizontal}
            onMouseDown={createResizeHandler('bottom', bottomPanelHeight)}
            onDoubleClick={createResizeResetHandler('bottom')}
          />
        ))}
      {editorBottomBarComponent}
    </div>
  );

  const [canvasRef, canvasSize] = useContainerSize<HTMLDivElement>();
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null);
  const [drawerMinHeight, setDrawerMinHeight] = useState(compactEditorPanelCollapsedHeight);

  const drawerMaxHeight = Math.max(
    drawerMinHeight,
    Math.round(canvasSize.height * 0.85),
  );
  const drawerFullHeight = Math.min(
    Math.max(compactEditorPanelHeight, drawerMinHeight),
    drawerMaxHeight,
  );
  const drawerHalfHeight = Math.min(
    drawerMaxHeight,
    Math.max(drawerMinHeight, Math.round(canvasSize.height * 0.5)),
  );
  const drawerSnapHeights = [drawerMinHeight, drawerHalfHeight, drawerFullHeight];
  const drawerHeightValue = Math.max(
    drawerMinHeight,
    Math.min(drawerHeight ?? drawerHalfHeight, drawerMaxHeight),
  );
  const isDrawerCollapsed = drawerHeightValue <= drawerMinHeight + 1;

  const handleDrawerSnap = (height: number) => {
    const nearest = drawerSnapHeights.reduce(
      (best, snap) => (Math.abs(snap - height) < Math.abs(best - height) ? snap : best),
      drawerSnapHeights[0],
    );
    setDrawerHeight(nearest);
  };

  const handleToggleDrawer = () => {
    setDrawerHeight(isDrawerCollapsed ? drawerHalfHeight : drawerMinHeight);
  };

  const handleQuickPanelSelect = (panelId: Panel) => {
    handlePanelSelect(panelId);
    if (isDrawerCollapsed) {
      setDrawerHeight(drawerHalfHeight);
    }
  };

  const quickPanelIds = [Panel.Adjustments, Panel.Crop, Panel.Masks, Panel.Presets];

  return (
    <div
      className={clsx(
        'flex grow h-full min-h-0',
        layoutMode === 'compact' ? 'relative flex-col' : 'flex-col',
      )}
    >
      <div
        ref={canvasRef}
        className={clsx('relative flex-1 flex flex-col min-w-0', layoutMode === 'compact' && 'min-h-0')}
      >
        {editorNode}

        {layoutMode === 'compact' && isDrawerCollapsed && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex items-center gap-1 rounded-lg border border-surface bg-bg-secondary/90 p-1 backdrop-blur-md">
            {quickPanelIds.map((panelId) => {
              const Icon = PANEL_ICONS[panelId];
              const isActive = activePanel === panelId && !isDrawerCollapsed;
              return (
                <button
                  key={panelId}
                  onClick={() => handleQuickPanelSelect(panelId)}
                  data-tooltip={t(PANEL_TITLES[panelId])}
                  className={clsx(
                    'flex items-center justify-center p-2.5 rounded-md transition-colors',
                    isActive
                      ? 'bg-surface text-text-primary'
                      : 'text-text-secondary active:bg-surface',
                  )}
                >
                  <Icon size={20} />
                </button>
              );
            })}
            <div className="flex-1" />
            <button
              onClick={handleToggleDrawer}
              data-tooltip={t('editor.switcher.tooltips.adjust')}
              className="flex items-center justify-center p-2.5 rounded-md text-text-secondary active:bg-surface"
            >
              <ChevronUp size={20} />
            </button>
          </div>
        )}

        <AnimatePresence>
          {isFilmstripInSidePanel && isDraggingFilmstrip && <FilmstripDropzone height={bottomPanelHeight} />}
        </AnimatePresence>
      </div>

      {layoutMode === 'compact' ? (
        <MobileDrawer
          height={drawerHeightValue}
          maxHeight={drawerMaxHeight}
          isCollapsed={isDrawerCollapsed}
          isHidden={isFullScreen}
          activePanel={activePanel}
          onHeightChange={setDrawerHeight}
          onSnap={handleDrawerSnap}
          onToggleCollapsed={handleToggleDrawer}
          onMinHeightChange={setDrawerMinHeight}
          renderPanel={renderAppPanel}
          switcher={
            <MobilePanelSwitcher activePanel={activePanel} onPanelSelect={handleQuickPanelSelect} />
          }
          footer={editorBottomBarComponent}
        />
      ) : (
        editorBottomBarNode
      )}
    </div>
  );
}
