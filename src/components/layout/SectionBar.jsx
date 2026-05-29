import React from 'react';
import { Table2, X, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { WeekNavigator } from './WeekNavigator';
import { FilterBar } from '../FilterBar';
import { ExportMenu } from '../ExportMenu';
import { text } from '../../lib/ui';

export const SectionBar = ({
  showPlanilha,
  weekRangeLabel,
  onPrevWeek,
  onNextWeek,
  onGoToCurrentWeek,
  onTogglePlanilha,
  onExportCsv,
  onImportClick,
  onWipeAll,
  showFilters,
  showEditorFilter,
  profileFilter,
  onProfileChange,
  editorFilter,
  onEditorChange
}) => (
  <section className="mb-8 border-b border-slate-100 pb-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {showPlanilha ? (
          <h2 className={`${text.h2} text-slate-900 whitespace-nowrap`}>
            <span className="text-blue-600">Controle</span> — todas postagens
          </h2>
        ) : (
          <>
            <h2 className={`${text.h2} text-slate-900 whitespace-nowrap`}>
              Semana <span className="text-blue-600">{weekRangeLabel}</span>
            </h2>
            <WeekNavigator onPrev={onPrevWeek} onNext={onNextWeek} onToday={onGoToCurrentWeek} />
          </>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {showFilters && (
          <FilterBar
            visible
            inline
            showEditor={showEditorFilter}
            profileFilter={profileFilter}
            onProfileChange={onProfileChange}
            editorFilter={editorFilter}
            onEditorChange={onEditorChange}
          />
        )}
        {onImportClick && (
          <Button
            variant="secondary"
            size="md"
            icon={Upload}
            onClick={onImportClick}
            title="Importar várias postagens de uma vez por texto"
          >
            Importar
          </Button>
        )}
        <ExportMenu onExport={onExportCsv} onWipe={onWipeAll} />
        <Button
          variant={showPlanilha ? 'primary' : 'dark'}
          size="md"
          icon={showPlanilha ? X : Table2}
          onClick={onTogglePlanilha}
          title={showPlanilha ? 'Voltar pra visualização' : 'Abrir planilha de controle'}
        >
          {showPlanilha ? 'Voltar' : 'Planilha'}
        </Button>
      </div>
    </div>
  </section>
);
