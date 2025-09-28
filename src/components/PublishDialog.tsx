"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  ExternalLink, 
  QrCode, 
  Code2,
  Check,
  Twitter,
  Facebook,
  Linkedin
} from "lucide-react";

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  publishResult: {
    shareUrl: string;
    embedCode: string;
    qrCode: string;
    prototypeId: string;
  } | null;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  isOpen,
  onClose,
  publishResult,
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!publishResult) return;
    
    const url = publishResult.shareUrl;
    const text = "Check out my prototype created with AI App Prototyper!";
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  if (!publishResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ExternalLink className="mr-2 h-5 w-5" />
            Prototype Published Successfully! 🎉
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Share URL</Label>
            <div className="flex space-x-2">
              <Input
                id="share-url"
                value={publishResult.shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(publishResult.shareUrl, 'url')}
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(publishResult.shareUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div className="space-y-2">
            <Label>Share on Social Media</Label>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('twitter')}
                className="flex items-center"
              >
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('facebook')}
                className="flex items-center"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareOnSocial('linkedin')}
                className="flex items-center"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="space-y-2">
            <Label htmlFor="embed-code">Embed Code</Label>
            <div className="space-y-2">
              <Textarea
                id="embed-code"
                value={publishResult.embedCode}
                readOnly
                rows={3}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(publishResult.embedCode, 'embed')}
                className="w-full"
              >
                {copied === 'embed' ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied Embed Code!
                  </>
                ) : (
                  <>
                    <Code2 className="mr-2 h-4 w-4" />
                    Copy Embed Code
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label>QR Code for Mobile Testing</Label>
            <div className="flex items-center space-x-4">
              <img 
                src={publishResult.qrCode} 
                alt="QR Code" 
                className="w-32 h-32 border rounded"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with your phone to test the prototype on mobile devices.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = publishResult.qrCode;
                    link.download = 'prototype-qr-code.png';
                    link.click();
                  }}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Coming Soon</h4>
            <p className="text-sm text-blue-700">
              Analytics and user feedback collection will be available in the next update. 
              Your prototype URL will remain active and you'll be able to track views and interactions.
            </p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 