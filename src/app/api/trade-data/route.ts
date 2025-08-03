import { NextRequest, NextResponse } from 'next/server';

// Sample trade data for realistic generation
const TRADE_COMMODITIES = [
  'Electronics', 'Textiles', 'Machinery', 'Food Products', 'Chemicals', 
  'Automotive Parts', 'Raw Materials', 'Medical Equipment', 'Energy Products',
  'Agricultural Products', 'Metals', 'Plastics', 'Pharmaceuticals', 'Furniture'
];

const COUNTRIES = [
  { code: 'US', name: 'United States', continent: 'North America' },
  { code: 'CN', name: 'China', continent: 'Asia' },
  { code: 'DE', name: 'Germany', continent: 'Europe' },
  { code: 'JP', name: 'Japan', continent: 'Asia' },
  { code: 'GB', name: 'United Kingdom', continent: 'Europe' },
  { code: 'IN', name: 'India', continent: 'Asia' },
  { code: 'FR', name: 'France', continent: 'Europe' },
  { code: 'IT', name: 'Italy', continent: 'Europe' },
  { code: 'BR', name: 'Brazil', continent: 'South America' },
  { code: 'CA', name: 'Canada', continent: 'North America' },
  { code: 'KR', name: 'South Korea', continent: 'Asia' },
  { code: 'NL', name: 'Netherlands', continent: 'Europe' },
  { code: 'MX', name: 'Mexico', continent: 'North America' },
  { code: 'AU', name: 'Australia', continent: 'Oceania' },
  { code: 'SG', name: 'Singapore', continent: 'Asia' },
];

interface TradeData {
  id: string;
  timestamp: string;
  type: 'import' | 'export';
  commodity: string;
  origin: string;
  destination: string;
  value: number;
  currency: string;
  volume: number;
  unit: string;
  tariffRate: number;
  riskScore: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

function generateRandomTradeData(count: number = 50): TradeData[] {
  const data: TradeData[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    const type = Math.random() > 0.5 ? 'import' : 'export';
    const commodity = TRADE_COMMODITIES[Math.floor(Math.random() * TRADE_COMMODITIES.length)];
    const origin = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const destination = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    
    // Ensure origin and destination are different
    let dest = destination;
    while (dest.code === origin.code) {
      dest = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    }

    const value = Math.floor(Math.random() * 10000000) + 100000; // $100K to $10M
    const volume = Math.floor(Math.random() * 10000) + 100;
    const tariffRate = Math.round((Math.random() * 25) * 100) / 100; // 0-25%
    const riskScore = Math.round((Math.random() * 100) * 100) / 100;
    const trends = ['up', 'down', 'stable'] as const;
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const changePercent = Math.round(((Math.random() * 20) - 10) * 100) / 100; // -10% to +10%

    data.push({
      id: `trade-${Date.now()}-${i}`,
      timestamp: timestamp.toISOString(),
      type,
      commodity,
      origin: origin.name,
      destination: dest.name,
      value,
      currency: 'USD',
      volume,
      unit: getUnitForCommodity(commodity),
      tariffRate,
      riskScore,
      trend,
      changePercent
    });
  }

  return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getUnitForCommodity(commodity: string): string {
  const units: Record<string, string> = {
    'Electronics': 'units',
    'Textiles': 'tons',
    'Machinery': 'units',
    'Food Products': 'tons',
    'Chemicals': 'tons',
    'Automotive Parts': 'units',
    'Raw Materials': 'tons',
    'Medical Equipment': 'units',
    'Energy Products': 'barrels',
    'Agricultural Products': 'tons',
    'Metals': 'tons',
    'Plastics': 'tons',
    'Pharmaceuticals': 'kg',
    'Furniture': 'units'
  };
  return units[commodity] || 'units';
}

function generateMarketSummary() {
  const totalTrades = Math.floor(Math.random() * 1000) + 500;
  const totalValue = Math.floor(Math.random() * 50000000000) + 10000000000; // $10B to $60B
  const avgRiskScore = Math.round((Math.random() * 100) * 100) / 100;
  const topCommodities = TRADE_COMMODITIES.slice(0, 5).map(commodity => ({
    name: commodity,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    change: Math.round(((Math.random() * 20) - 10) * 100) / 100
  }));

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalTrades,
      totalValue,
      currency: 'USD',
      avgRiskScore,
      topCommodities,
      marketStatus: avgRiskScore < 30 ? 'Low Risk' : avgRiskScore < 60 ? 'Medium Risk' : 'High Risk'
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') as 'live' | 'summary' | null;
    const count = parseInt(url.searchParams.get('count') || '50');
    const commodity = url.searchParams.get('commodity');
    const country = url.searchParams.get('country');

    if (type === 'summary') {
      return NextResponse.json(generateMarketSummary());
    }

    let tradeData = generateRandomTradeData(count);

    // Apply filters if provided
    if (commodity) {
      tradeData = tradeData.filter(trade => 
        trade.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }

    if (country) {
      tradeData = tradeData.filter(trade => 
        trade.origin.toLowerCase().includes(country.toLowerCase()) ||
        trade.destination.toLowerCase().includes(country.toLowerCase())
      );
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: tradeData,
      metadata: {
        total: tradeData.length,
        filters: { commodity, country },
        generated: true
      }
    });

  } catch (error) {
    console.error('Trade data API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trade data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters } = body;

    // Generate contextual trade data based on query
    let tradeData = generateRandomTradeData(30);

    // Apply AI-like filtering based on query
    if (query) {
      const queryLower = query.toLowerCase();
      if (queryLower.includes('import')) {
        tradeData = tradeData.filter(trade => trade.type === 'import');
      } else if (queryLower.includes('export')) {
        tradeData = tradeData.filter(trade => trade.type === 'export');
      }

      // Filter by commodity mentions in query
      const mentionedCommodity = TRADE_COMMODITIES.find(commodity =>
        queryLower.includes(commodity.toLowerCase())
      );
      if (mentionedCommodity) {
        tradeData = tradeData.filter(trade => trade.commodity === mentionedCommodity);
      }

      // Filter by country mentions
      const mentionedCountry = COUNTRIES.find(country =>
        queryLower.includes(country.name.toLowerCase())
      );
      if (mentionedCountry) {
        tradeData = tradeData.filter(trade =>
          trade.origin === mentionedCountry.name || trade.destination === mentionedCountry.name
        );
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      query,
      data: tradeData.slice(0, 20), // Limit for chat context
      insights: generateInsights(tradeData),
      metadata: {
        total: tradeData.length,
        queryProcessed: true
      }
    });

  } catch (error) {
    console.error('Trade data query error:', error);
    return NextResponse.json(
      { error: 'Failed to process trade data query' },
      { status: 500 }
    );
  }
}

function generateInsights(data: TradeData[]) {
  if (data.length === 0) return [];

  const insights = [];
  
  // Value insights
  const totalValue = data.reduce((sum, trade) => sum + trade.value, 0);
  const avgValue = totalValue / data.length;
  insights.push(`Total trade value: $${(totalValue / 1000000).toFixed(1)}M`);
  insights.push(`Average trade value: $${(avgValue / 1000).toFixed(0)}K`);

  // Risk insights
  const avgRisk = data.reduce((sum, trade) => sum + trade.riskScore, 0) / data.length;
  insights.push(`Average risk score: ${avgRisk.toFixed(1)}/100`);

  // Trend insights
  const upTrends = data.filter(trade => trade.trend === 'up').length;
  const trendPercentage = (upTrends / data.length) * 100;
  insights.push(`${trendPercentage.toFixed(0)}% of trades showing upward trend`);

  // Top commodity
  const commodityCounts = data.reduce((acc, trade) => {
    acc[trade.commodity] = (acc[trade.commodity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCommodity = Object.entries(commodityCounts)
    .sort(([,a], [,b]) => b - a)[0];
  if (topCommodity) {
    insights.push(`Most traded commodity: ${topCommodity[0]} (${topCommodity[1]} trades)`);
  }

  return insights;
}