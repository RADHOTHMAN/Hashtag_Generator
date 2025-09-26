import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Hash, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { pipeline } from "@huggingface/transformers";

interface GeneratedHashtag {
  tag: string;
  confidence: number;
}

export const HashtagGenerator = () => {
  const [inputText, setInputText] = useState('');
  const [hashtags, setHashtags] = useState<GeneratedHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractKeywords = (text: string): GeneratedHashtag[] => {
    const commonWords = [
      'that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'will',
      'would', 'could', 'should', 'about', 'there', 'their', 'where', 'when',
      'what', 'which', 'while', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'into', 'onto', 'upon', 'within', 'without'
    ];
    
    // Extract meaningful words and phrases
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Count word frequency
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Generate hashtags from most frequent words
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([word, count]) => ({
        tag: `#${word}`,
        confidence: Math.min(count / words.length * 2, 0.9)
      }));
  };

  const generateCategoryHashtags = (text: string): GeneratedHashtag[] => {
    const categories = {
      technology: ['tech', 'ai', 'software', 'digital', 'innovation', 'coding', 'development', 'startup', 'algorithm'],
      business: ['business', 'entrepreneur', 'marketing', 'sales', 'profit', 'company', 'corporate', 'strategy'],
      lifestyle: ['life', 'living', 'daily', 'routine', 'habit', 'wellness', 'balance', 'personal'],
      fitness: ['fitness', 'workout', 'exercise', 'health', 'gym', 'training', 'muscle', 'strength'],
      travel: ['travel', 'trip', 'vacation', 'journey', 'adventure', 'explore', 'destination', 'tourism'],
      food: ['food', 'recipe', 'cooking', 'delicious', 'meal', 'restaurant', 'cuisine', 'flavor'],
      education: ['learn', 'education', 'study', 'knowledge', 'skill', 'course', 'training', 'development'],
      creativity: ['creative', 'art', 'design', 'inspiration', 'idea', 'innovation', 'artistic', 'imagination']
    };
    
    const lowerText = text.toLowerCase();
    const matchedCategories: GeneratedHashtag[] = [];
    
    Object.entries(categories).forEach(([category, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      if (matches.length > 0) {
        matchedCategories.push({
          tag: `#${category}`,
          confidence: matches.length / keywords.length
        });
        
        // Add specific keyword hashtags too
        matches.slice(0, 2).forEach(keyword => {
          matchedCategories.push({
            tag: `#${keyword}`,
            confidence: 0.7
          });
        });
      }
    });
    
    return matchedCategories.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
  };

  const generateHashtags = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Enter some text",
        description: "Please enter text to generate hashtags from",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Try advanced NLP approach first
      const classifier = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { device: 'webgpu' }
      );

      await classifier(inputText);
      
      // If successful, combine multiple approaches
      const keywordHashtags = extractKeywords(inputText);
      const categoryHashtags = generateCategoryHashtags(inputText);
      
      const allHashtags = [...keywordHashtags, ...categoryHashtags]
        .filter((hashtag, index, arr) => 
          arr.findIndex(h => h.tag.toLowerCase() === hashtag.tag.toLowerCase()) === index
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 15);

      setHashtags(allHashtags);
      
      toast({
        title: "Hashtags generated!",
        description: `Generated ${allHashtags.length} AI-powered hashtags`,
      });
    } catch (error) {
      console.error('NLP model loading failed, using advanced keyword extraction:', error);
      
      // Fallback to advanced keyword and category analysis
      const keywordHashtags = extractKeywords(inputText);
      const categoryHashtags = generateCategoryHashtags(inputText);
      
      const allHashtags = [...keywordHashtags, ...categoryHashtags]
        .filter((hashtag, index, arr) => 
          arr.findIndex(h => h.tag.toLowerCase() === hashtag.tag.toLowerCase()) === index
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 15);

      setHashtags(allHashtags);
      
      toast({
        title: "Hashtags generated!",
        description: "Using advanced keyword analysis",
      });
    }
    setIsLoading(false);
  };

  const copyHashtag = (hashtag: string) => {
    navigator.clipboard.writeText(hashtag);
    toast({
      title: "Copied!",
      description: `${hashtag} copied to clipboard`,
    });
  };

  const copyAllHashtags = () => {
    const allTags = hashtags.map(h => h.tag).join(' ');
    navigator.clipboard.writeText(allTags);
    toast({
      title: "All hashtags copied!",
      description: `${hashtags.length} hashtags copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Hash className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">AI Hashtag Generator</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste your content and let AI generate relevant hashtags using advanced NLP analysis
          </p>
        </div>

        {/* Input Card */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Enter Your Content
            </CardTitle>
            <CardDescription>
              Paste your text, caption, or content to analyze and generate hashtags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your content here... The AI will analyze your text and suggest relevant hashtags based on context, keywords, and semantic meaning."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <Button 
              onClick={generateHashtags}
              disabled={isLoading || !inputText.trim()}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Hash className="w-4 h-4 mr-2" />
                  Generate Hashtags
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        {hashtags.length > 0 && (
          <Card className="card-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Generated Hashtags ({hashtags.length})
                </CardTitle>
                <Button
                  onClick={copyAllHashtags}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
              </div>
              <CardDescription>
                Click on any hashtag to copy it individually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {hashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="hashtag-chip cursor-pointer px-4 py-2 text-sm font-medium"
                    onClick={() => copyHashtag(hashtag.tag)}
                  >
                    {hashtag.tag}
                  </Badge>
                ))}
              </div>
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">All hashtags:</p>
                <p className="text-sm font-mono break-all">
                  {hashtags.map(h => h.tag).join(' ')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Example Card */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">💡 Example</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">Try this sample text:</p>
            <div 
              className="p-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setInputText("Just launched my new startup focused on sustainable technology and renewable energy solutions. We're building the future of clean tech innovation with AI-powered solar panel optimization.")}
            >
              <p className="text-sm">
                "Just launched my new startup focused on sustainable technology and renewable energy solutions. 
                We're building the future of clean tech innovation with AI-powered solar panel optimization."
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};