// components/MarkdownAnswer.jsx
import React, { memo } from 'react';

const MarkdownAnswer = memo(({ answer }) => {
  // Fonction pour normaliser les caractères accentués
  const normalizeText = (text) => {
    if (!text) return '';
    return text;
  };

  // Fonction pour formater le markdown inline
  const formatInlineMarkdown = (text) => {
    if (!text) return '';
    
    let formatted = text;
    
    // Gras
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700;">$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong style="font-weight: 700;">$1</strong>');
    
    // Italique
    formatted = formatted.replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>');
    
    // Code inline
    formatted = formatted.replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #db2777;">$1</code>');
    
    return formatted;
  };
  
  // Fonction pour formater le contenu d'une cellule (listes, puces, etc.)
  const formatCellContent = (content) => {
    if (!content) return '';
    
    // Vérifier si la cellule contient une liste
    if (content.includes('<li>')) {
      return content;
    }
    
    // Remplacer les puces • par des listes stylisées
    if (content.includes('•') || content.includes('-') || content.includes('*')) {
      const items = content.split(/[•\-*]\s*/).filter(item => item.trim());
      if (items.length > 1) {
        return `
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${items.map(item => `
              <li style="margin: 4px 0; display: flex; align-items: flex-start; gap: 6px;">
                <span style="color: #10b981; font-size: 12px;">✓</span>
                <span>${formatInlineMarkdown(item.trim())}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }
    }
    
    return formatInlineMarkdown(content);
  };

  // Fonction principale de conversion markdown vers HTML
  const markdownToHtml = (text) => {
    if (!text) return '';
    
    let html = text;
    
    // 1. Protection des blocs de code (pour ne pas parser à l'intérieur)
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const index = codeBlocks.length;
      codeBlocks.push({ lang, code: code.trim() });
      return `%%CODE_BLOCK_${index}%%`;
    });
    
    // 2. Protection des balises HTML existantes
    const htmlTags = [];
    html = html.replace(/<[^>]+>/g, (match) => {
      const index = htmlTags.length;
      htmlTags.push(match);
      return `%%HTML_TAG_${index}%%`;
    });
    
    // 3. Conversion des titres
    html = html.replace(/^### (.*$)/gm, '<h3 style="margin: 20px 0 12px 0; font-size: 18px; font-weight: 600; color: #0f172a; border-left: 4px solid #3b82f6; padding-left: 12px;">$1</h3>');
    html = html.replace(/^#### (.*$)/gm, '<h4 style="margin: 16px 0 10px 0; font-size: 16px; font-weight: 600; color: #1e293b;">$1</h4>');
    
    // 4. Conversion des tableaux
    html = html.replace(/\n?(\|.+\|)\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/gm, (match, headerRow, bodyRows) => {
      // Parser l'en-tête
      const headers = headerRow.split('|')
        .filter(cell => cell.trim())
        .map(cell => cell.trim());
      
      // Parser les lignes du corps
      const rows = bodyRows.trim().split('\n')
        .filter(row => row.includes('|'))
        .map(row => 
          row.split('|')
            .filter(cell => cell.trim())
            .map(cell => cell.trim())
        );
      
      // Générer le tableau HTML stylisé
      return `
        <div style="overflow-x: auto; margin: 20px 0; border-radius: 12px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; background: white;">
            <thead>
              <tr style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);">
                ${headers.map(header => `
                  <th style="border-bottom: 2px solid #cbd5e1; padding: 14px 16px; text-align: left; font-weight: 600; color: #0f172a;">
                    ${formatInlineMarkdown(header)}
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, rowIndex) => `
                <tr style="${rowIndex % 2 === 0 ? 'background: white;' : 'background: #f8fafc;'}">
                  ${row.map((cell, cellIndex) => `
                    <td style="border-bottom: 1px solid #e2e8f0; padding: 12px 16px; vertical-align: top; ${cellIndex === 0 ? 'font-weight: 500; color: #1e293b;' : 'color: #475569;'}">
                      ${formatCellContent(cell)}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });
    
    // 5. Conversion des listes (non ordonnées)
    html = html.replace(/^[\s]*[-*+]\s+(.*$)/gm, (match, content) => {
      return `<li style="margin: 6px 0; display: flex; align-items: flex-start; gap: 8px;">
        <span style="color: #3b82f6; font-weight: bold;">✓</span>
        <span>${formatInlineMarkdown(content)}</span>
      </li>`;
    });
    
    // Grouper les listes
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      return `<ul style="margin: 12px 0; padding-left: 0; list-style: none;">${match}</ul>`;
    });
    
    // 6. Conversion des listes ordonnées
    html = html.replace(/^[\s]*\d+\.\s+(.*$)/gm, (match, content) => {
      const num = match.match(/\d+/)[0];
      return `<li style="margin: 6px 0; display: flex; align-items: flex-start; gap: 8px;">
        <span style="background: #3b82f6; color: white; width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">${num}</span>
        <span>${formatInlineMarkdown(content)}</span>
      </li>`;
    });
    
    html = html.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, (match) => {
      return `<ol style="margin: 12px 0; padding-left: 0; list-style: none;">${match}</ol>`;
    });
    
    // 7. Conversion des citations
    html = html.replace(/^>\s+(.*$)/gm, (match, content) => {
      return `<div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 16px 20px; border-left: 4px solid #3b82f6; border-radius: 8px; margin: 16px 0; font-style: italic; color: #1e3a8a;">
        <span style="font-size: 20px; margin-right: 8px;">💡</span>
        ${formatInlineMarkdown(content)}
      </div>`;
    });
    
    // 8. Conversion des lignes horizontales
    html = html.replace(/^---$/gm, '<hr style="margin: 24px 0; border: none; height: 1px; background: linear-gradient(90deg, transparent, #cbd5e1, transparent);" />');
    
    // 9. Conversion des paragraphes
    html = html.split('\n\n').map(para => {
      if (para.trim() && 
          !para.match(/^<h[3-4]|<ul|<ol|<div|<table|<hr/) && 
          !para.includes('%%CODE_BLOCK_') &&
          !para.includes('%%HTML_TAG_')) {
        return `<p style="margin: 12px 0; line-height: 1.6; color: #334155;">${formatInlineMarkdown(para)}</p>`;
      }
      return para;
    }).join('');
    
    // 10. Restaurer les blocs de code
    codeBlocks.forEach((block, index) => {
      const codeHtml = `
        <div style="margin: 16px 0; border-radius: 8px; overflow: hidden; background: #1e293b;">
          ${block.lang ? `<div style="background: #0f172a; padding: 8px 12px; font-size: 12px; color: #94a3b8; border-bottom: 1px solid #334155;">${block.lang}</div>` : ''}
          <pre style="margin: 0; padding: 16px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 13px; color: #e2e8f0; line-height: 1.5;">${escapeHtml(block.code)}</pre>
        </div>
      `;
      html = html.replace(`%%CODE_BLOCK_${index}%%`, codeHtml);
    });
    
    // 11. Restaurer les balises HTML
    htmlTags.forEach((tag, index) => {
      html = html.replace(`%%HTML_TAG_${index}%%`, tag);
    });
    
    return html;
  };
  
  // Fonction pour échapper le HTML
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };
  
  // Ajouter les styles d'animation
  const styles = `
    <style>
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .markdown-answer {
        animation: fadeInUp 0.3s ease-out;
      }
      .markdown-answer table {
        animation: fadeInUp 0.4s ease-out;
      }
      .markdown-answer tr:hover td {
        background: #fef3c7 !important;
        transition: background 0.2s ease;
      }
    </style>
  `;
  
  const htmlContent = markdownToHtml(answer);
  
 return (
    <div 
      className="markdown-answer"
      style={{ 
        lineHeight: 1.6,
        fontSize: '14px',
      }}
      dangerouslySetInnerHTML={{ 
        __html: styles + htmlContent
      }}
    />
  );
});

export default MarkdownAnswer;
