import { Tooltip, Box, Typography, TooltipProps } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { GridColumnHeaderParams } from '@mui/x-data-grid-premium';

export interface HeaderWithTooltipProps {
  params: GridColumnHeaderParams;
  tooltipTitle: TooltipProps["title"];
  originalRenderHeader?: (params: GridColumnHeaderParams) => React.ReactNode;
}

export const HeaderWithTooltip = ({ params, tooltipTitle, originalRenderHeader }: HeaderWithTooltipProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {originalRenderHeader ? (
          originalRenderHeader(params)
        ) : (
          // Fallback to default behavior (showing the headerName)
          <Typography variant="subtitle2" noWrap>
            {params.colDef.headerName || params.field}
          </Typography>
        )}
      </Box>
      <Tooltip title={tooltipTitle}>
        <InfoOutlinedIcon fontSize="inherit" color="primary" />
      </Tooltip>
    </Box>
  );
};