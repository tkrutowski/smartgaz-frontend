// composables/useEc2Control.ts
import { ref } from 'vue';

const API_URL = 'https://vxy52veych.execute-api.eu-central-1.amazonaws.com';

export type EnsureInstanceRunningPhase = 'checking' | 'starting' | 'waiting';

export function useEc2Control() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function controlInstance(instanceId: string, action: 'start' | 'stop' | 'status') {
    console.log('controlInstance', instanceId, action);
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/ec2/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId,
          action,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function startInstance(instanceId: string) {
    return controlInstance(instanceId, 'start');
  }

  async function stopInstance(instanceId: string) {
    return controlInstance(instanceId, 'stop');
  }
  async function getInstanceStatus(instanceId: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/ec2/status?instanceId=${encodeURIComponent(instanceId)}&action=status`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function ensureInstanceRunning(
      instanceId: string,
      options?: {
        pollIntervalMs?: number;
        timeoutMs?: number;
        onPhase?: (phase: EnsureInstanceRunningPhase) => void;
      }
  ): Promise<void> {
    const pollIntervalMs = options?.pollIntervalMs ?? 5000;
    const timeoutMs = options?.timeoutMs ?? 120000;
    const onPhase = options?.onPhase;

    function getState(data: { state?: string; status?: string }): string {
      const raw = data?.state ?? data?.status ?? '';
      return String(raw).toLowerCase();
    }

    onPhase?.('checking');
    let data = await getInstanceStatus(instanceId);
    let state = getState(data);

    if (state === 'running') {
      return;
    }

    onPhase?.('starting');
    await startInstance(instanceId);

    onPhase?.('waiting');
    const startTime = Date.now();

    while (true) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('Timeout: serwer nie uruchomił się w przewidzianym czasie. Spróbuj za chwilę.');
      }
      data = await getInstanceStatus(instanceId);
      state = getState(data);
      if (state === 'running') {
        return;
      }
    }
  }

  return {
    loading,
    error,
    startInstance,
    stopInstance,
    getInstanceStatus,
    controlInstance,
    ensureInstanceRunning,
  };
}
