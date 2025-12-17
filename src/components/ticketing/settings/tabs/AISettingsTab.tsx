import React, { useState, useEffect } from 'react';
import {
  SparklesIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import {
  getAISettings,
  updateAISettings,
  getAIProviders,
  testAIConnection,
  AISettingsResponse,
  AIProviderInfo,
} from '../../../../api/aiSettingsApi';
import { getAIStatus, AIStatusResponse } from '../../../../api/aiApi';
import { toast } from 'react-hot-toast';

const AISettingsTab: React.FC = () => {
  // Settings state
  const [settings, setSettings] = useState<AISettingsResponse | null>(null);
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; time?: number } | null>(null);
  
  // Form state
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [maxTokens, setMaxTokens] = useState(1024);
  const [temperature, setTemperature] = useState(0.3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(60);
  const [azureApiVersion, setAzureApiVersion] = useState('2024-02-01');
  
  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadData();
  }, []);

  // Track changes
  useEffect(() => {
    if (settings) {
      const changed = 
        enabled !== settings.enabled ||
        provider !== settings.provider ||
        (apiKey !== '' && !apiKey.includes('*')) ||
        baseUrl !== settings.baseUrl ||
        getSelectedModel() !== settings.model ||
        maxTokens !== settings.maxTokens ||
        temperature !== settings.temperature ||
        timeoutSeconds !== settings.timeoutSeconds;
      setHasChanges(changed);
    }
  }, [enabled, provider, apiKey, baseUrl, model, customModel, maxTokens, temperature, timeoutSeconds, settings]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, providersData, statusData] = await Promise.all([
        getAISettings().catch(() => null),
        getAIProviders().catch(() => ({ providers: [] })),
        getAIStatus().catch(() => null),
      ]);
      
      if (settingsData) {
        setSettings(settingsData);
        setEnabled(settingsData.enabled);
        setProvider(settingsData.provider);
        setApiKey(settingsData.apiKeyMasked);
        setBaseUrl(settingsData.baseUrl);
        setModel(settingsData.model);
        setMaxTokens(settingsData.maxTokens);
        setTemperature(settingsData.temperature);
        setTimeoutSeconds(settingsData.timeoutSeconds);
        if (settingsData.azureApiVersion) {
          setAzureApiVersion(settingsData.azureApiVersion);
        }
      }
      
      setProviders(providersData.providers);
      setAiStatus(statusData);
    } catch (error) {
      console.error('Failed to load AI settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedModel = () => {
    return model === 'custom' ? customModel : model;
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    const providerInfo = providers.find(p => p.id === newProvider);
    if (providerInfo) {
      setBaseUrl(providerInfo.defaultBaseUrl);
      if (providerInfo.suggestedModels.length > 0) {
        setModel(providerInfo.suggestedModels[0]);
      }
    }
    setTestResult(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = await updateAISettings({
        enabled,
        provider,
        apiKey: apiKey.includes('*') ? undefined : apiKey,
        baseUrl,
        model: getSelectedModel(),
        maxTokens,
        temperature,
        timeoutSeconds,
        azureApiVersion: provider === 'azure' ? azureApiVersion : undefined,
      });
      
      setSettings(updatedSettings);
      setApiKey(updatedSettings.apiKeyMasked);
      setHasChanges(false);
      toast.success('AI settings saved successfully');
      
      // Reload status
      const statusData = await getAIStatus().catch(() => null);
      setAiStatus(statusData);
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      toast.error('Failed to save AI settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      const result = await testAIConnection({
        provider,
        apiKey: apiKey.includes('*') ? undefined : apiKey,
        baseUrl,
        model: getSelectedModel(),
      });
      
      setTestResult({
        success: result.success,
        message: result.message,
        time: result.responseTimeMs,
      });
      
      if (result.success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === provider);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">Loading AI settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <SparklesIcon className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Configuration</h2>
            <p className="text-sm text-gray-500">
              Configure AI-powered features for ticket assistance
            </p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {aiStatus?.connected ? (
            <span className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
              Connected
            </span>
          ) : aiStatus?.enabled ? (
            <span className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
              Not Connected
            </span>
          ) : (
            <span className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <XCircleIcon className="h-4 w-4 mr-1.5" />
              Disabled
            </span>
          )}
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Enable AI Features</h3>
            <p className="text-sm text-gray-500">
              Turn on AI-powered ticket categorization, response suggestions, and summarization
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-red-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className={`space-y-4 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Provider Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" />
            Provider Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              {selectedProvider && selectedProvider.suggestedModels.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {selectedProvider.suggestedModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="custom">Custom model...</option>
                  </select>
                  {model === 'custom' && (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="Enter custom model name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Enter model name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              )}
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {settings?.hasApiKey ? 'API key is configured (masked for security)' : 'No API key configured'}
              </p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Azure API Version (only for Azure) */}
            {provider === 'azure' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Azure API Version
                </label>
                <input
                  type="text"
                  value={azureApiVersion}
                  onChange={(e) => setAzureApiVersion(e.target.value)}
                  placeholder="2024-02-01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <BeakerIcon className="h-5 w-5 mr-2 text-gray-500" />
            Advanced Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1024)}
                min={100}
                max={8000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Max response length (100-8000)</p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                min={0}
                max={2}
                step={0.1}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (seconds)
              </label>
              <input
                type="number"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(parseInt(e.target.value) || 60)}
                min={10}
                max={300}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Request timeout (10-300)</p>
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Test Connection</h3>
              <p className="text-sm text-gray-500">
                Verify your API settings are working correctly
              </p>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {isTesting ? (
                <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <BeakerIcon className="h-5 w-5 mr-2" />
              )}
              Test Connection
            </button>
          </div>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start">
                {testResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="ml-2">
                  <p className={`text-sm font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.time && (
                    <p className="text-xs text-gray-500 mt-1">
                      Response time: {testResult.time}ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About AI Features
              </h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>• <strong>Smart Categorization:</strong> Automatically suggest category and priority for new tickets</p>
                <p>• <strong>Response Suggestions:</strong> Generate professional reply templates for agents</p>
                <p>• <strong>Ticket Summarization:</strong> Get quick summaries of long ticket threads</p>
                <p className="mt-2 text-xs">Note: Changes require a server restart to take effect.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={loadData}
          disabled={isLoading || isSaving}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isSaving ? (
            <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 mr-2" />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AISettingsTab;
