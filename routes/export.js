// Ajouter ces états
const [showExportModal, setShowExportModal] = useState(false);
const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
const [exportFilters, setExportFilters] = useState({
  startDate: '',
  endDate: '',
  status: 'all'
});

// Ajouter cette fonction
const handleExport = async (): Promise<void> => {
  try {
    await apiService.exportSessions(exportFormat, exportFilters);
    setShowExportModal(false);
    
    // Réinitialiser les filtres
    setExportFilters({
      startDate: '',
      endDate: '',
      status: 'all'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur export:', error);
    alert(`Erreur lors de l'export: ${error.message}`);
  }
};

// Remplacer le bouton Export existant par :
<button 
  onClick={() => setShowExportModal(true)}
  className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
>
  <Download className="w-4 h-4 mr-2" />
  Export
</button>
// Ajouter cette route à vos routes sessions existantes
router.get('/stats', async (req, res) => {
  try {
    const total = await Session.countDocuments();
    const active = await Session.countDocuments({ status: 'active' });
    const completed = await Session.countDocuments({ status: 'terminé' });
    const paid = await Session.countDocuments({ status: 'payé' });

    res.json({
      total,
      active,
      completed,
      paid
    });
  } catch (error) {
    console.error('❌ Erreur stats sessions:', error);
    res.status(500).json({ error: 'Erreur lors du calcul des statistiques' });
  }
});