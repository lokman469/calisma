import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Alert,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { templateService } from '../services/templateService';

// Şablon dialog bileşeni
const TemplateDialog = React.memo(({ 
  open, 
  template, 
  editMode, 
  onClose, 
  onSave,
  loading 
}) => {
  const [formData, setFormData] = useState(template || {
    name: '',
    description: '',
    conditions: [],
    notifications: {
      email: false,
      push: false,
      telegram: false
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="template-dialog-title"
    >
      <DialogTitle id="template-dialog-title">
        {editMode ? 'Şablonu Düzenle' : 'Yeni Şablon'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Şablon Adı"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={loading}
            required
          />
          <TextField
            fullWidth
            label="Açıklama"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={loading}
            multiline
            rows={3}
          />
          {/* Diğer form alanları */}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.name}
          startIcon={<SaveIcon />}
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
});

function AlertTemplates({ 
  onApplyTemplate, 
  loading = false,
  error = null 
}) {
  const theme = useTheme();
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Şablonları kategorilere göre grupla
  const groupedTemplates = useMemo(() => {
    return templates.reduce((acc, template) => {
      const category = template.category || 'Diğer';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(template);
      return acc;
    }, {});
  }, [templates]);

  const handleAddTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setEditMode(false);
    setOpenDialog(true);
  }, []);

  const handleEditTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    setEditMode(true);
    setOpenDialog(true);
  }, []);

  const handleDeleteTemplate = useCallback(async (templateId) => {
    try {
      // API çağrısı
      await templateService.deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Template silme hatası:', error);
    }
  }, []);

  const handleSaveTemplate = useCallback(async (templateData) => {
    try {
      if (editMode) {
        // Güncelleme API çağrısı
        const updated = await templateService.updateTemplate(selectedTemplate.id, templateData);
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        // Yeni ekleme API çağrısı
        const created = await templateService.createTemplate(templateData);
        setTemplates(prev => [...prev, created]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Template kaydetme hatası:', error);
    }
  }, [editMode, selectedTemplate]);

  if (error) {
    return (
      <Alert 
        severity="error"
        icon={<WarningIcon />}
        sx={{ mb: 2 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Alarm Şablonları
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTemplate}
          disabled={loading}
        >
          Yeni Şablon
        </Button>
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={24} width="60%" />
                  <Skeleton height={20} width="40%" sx={{ mt: 1 }} />
                  <Skeleton height={60} sx={{ mt: 2 }} />
                </CardContent>
                <CardActions>
                  <Skeleton width={120} height={36} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <React.Fragment key={category}>
              <Grid item xs={12}>
                <Typography variant="h6" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                  {category}
                </Typography>
              </Grid>
              {categoryTemplates.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {template.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {template.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {template.tags?.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{ backgroundColor: theme.palette.action.selected }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Tooltip title="Şablonu Uygula">
                        <Button
                          size="small"
                          onClick={() => onApplyTemplate(template)}
                          startIcon={<ContentCopy />}
                        >
                          Uygula
                        </Button>
                      </Tooltip>
                      {!template.isDefault && (
                        <>
                          <Tooltip title="Düzenle">
                            <IconButton
                              size="small"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      )}

      <TemplateDialog
        open={openDialog}
        template={selectedTemplate}
        editMode={editMode}
        onClose={() => setOpenDialog(false)}
        onSave={handleSaveTemplate}
        loading={loading}
      />
    </Box>
  );
}

AlertTemplates.propTypes = {
  onApplyTemplate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string
};

TemplateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  template: PropTypes.object,
  editMode: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default AlertTemplates; 