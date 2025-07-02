"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Download, Type, FileImage } from 'lucide-react';
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';
import { supabase } from '@/lib/supabase';

type Template = {
  template_id: number;
  name: string;
  image_url: string;
  thumbnail_url: string;
  usage_count: number;
  created_at: Timestamp;
};

type TextZone = {
  zone_id: number,
  template_id: number,
  zone_name: string;
  x_position: string; // percentage string like "60%"
  y_position: string;
  width: string;
  height: string;
  font_size: string; // e.g., "24px"
  text_color: string;
};

type TextValues = Record<string, string>;

export default function MemeGenerator() {

  const [templates, setTemplates] = useState<Template[]>([]);
  const [textZones, setTextZones] = useState<TextZone[]>([]);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select();

    if (error) {
      console.error('Error fetching templates:', error);
    } else if (data) {
      setTemplates(data);
    }
  };

  const fetchTextZones = async () => {
    const { data, error } = await supabase
      .from('text_zones') // Assuming your table is named `text_zones`
      .select();

    if (error) {
      console.error('Error fetching text zones:', error);
    } else if (data) {
      setTextZones(data);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchTextZones();
  }, []);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [textValues, setTextValues] = useState<TextValues>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    const zones = textZones.filter(zone => zone.template_id === template.template_id);
    const initialText: TextValues = {};
    zones.forEach(zone => {
      initialText[zone.zone_name] = '';
    });
    setTextValues(initialText);
  };

  const handleTextChange = (zoneName: string, value: string) => {
    setTextValues(prev => ({
      ...prev,
      [zoneName]: value
    }));
  };

  const generateMeme = async () => {
    if (!selectedTemplate || !canvasRef.current) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const zones = textZones.filter(zone => zone.template_id === selectedTemplate.template_id);
      zones.forEach(zone => {
        const text = textValues[zone.zone_name] || '';
        if (text) {
          ctx.font = `bold ${zone.font_size} Arial`;
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.textAlign = 'center';

          const x = (parseFloat(zone.x_position) / 100) * canvas.width;
          const y = (parseFloat(zone.y_position) / 100) * canvas.height;

          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        }
      });

      setIsGenerating(false);
    };

    img.src = selectedTemplate.image_url;
  };

  const downloadMeme = () => {
    if (!canvasRef.current || !selectedTemplate) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${selectedTemplate.name.replace(/\s+/g, '_')}_meme.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('Meme copied to clipboard!');
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Copy failed - try download instead');
    }
  };

  useEffect(() => {
    if (selectedTemplate && Object.keys(textValues).length > 0) {
      generateMeme();
    }
  }, [selectedTemplate, textValues]);

   return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Meme Generator
        </h1>

        {!selectedTemplate ? (
          // Template Selection
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FileImage className="w-6 h-6" />
              Choose a Template
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {templates.map(template => (
                <div
                  key={template.template_id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-all duration-200 hover:scale-105"
                >
                  <img
                    src={template.thumbnail_url}
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Meme Editor
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Left Side - Controls */}
            <div className="space-y-6">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-purple-400 hover:text-purple-300 mb-4"
              >
                ← Back to Templates
              </button>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Add Your Text
                </h2>
                
                <div className="space-y-4">
                  {textZones
                    .filter(zone => zone.template_id === selectedTemplate.template_id)
                    .map(zone => (
                      <div key={zone.zone_name}>
                        <label className="block text-sm font-medium mb-2 capitalize">
                          {zone.zone_name.replace('_', ' ')}
                        </label>
                        <input
                          type="text"
                          value={textValues[zone.zone_name] || ''}
                          onChange={(e) => handleTextChange(zone.zone_name, e.target.value)}
                          placeholder={`Enter ${zone.zone_name.replace('_', ' ')}...`}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:border-purple-500 focus:outline-none"
                          maxLength={100}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={downloadMeme}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={isGenerating}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-medium transition-all disabled:opacity-50"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Right Side - Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-96">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-96 rounded shadow-lg"
                  style={{ display: isGenerating ? 'none' : 'block' }}
                />
                {isGenerating && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p>Generating meme...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
