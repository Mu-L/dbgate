<script lang="ts">
  import { onMount, tick } from 'svelte';

  import FormStyledButton from '../buttons/FormStyledButton.svelte';
  import UploadButton from '../buttons/UploadButton.svelte';

  import FormProvider from '../forms/FormProvider.svelte';
  import FormSubmit from '../forms/FormSubmit.svelte';
  import { currentDropDownMenu } from '../stores';
  import { apiCall } from '../utility/api';
  import { importSqlDump } from '../utility/exportFileTools';
  import getElectron from '../utility/getElectron';
  import { setUploadListener } from '../utility/uploadFiles';
  import ChangeDownloadUrlModal from './ChangeDownloadUrlModal.svelte';
  import ModalBase from './ModalBase.svelte';
  import { closeCurrentModal, showModal } from './modalTools';
  import { getConnectionLabel } from 'dbgate-tools';

  export let connection;

  let inputLabel = '(not selected)';
  let inputFile = null;
  let domButton;

  const handleSubmit = async values => {
    const { value } = values;
    closeCurrentModal();
    importSqlDump(inputFile, connection);
  };

  const electron = getElectron();

  const handleUpload = file => {
    inputLabel = `uploaded: ${file.shortName}`;
    inputFile = file.filePath;
  };

  onMount(() => {
    setUploadListener(handleUpload);

    return () => {
      setUploadListener(null);
    };
  });

  const handleAddUrl = () => {
    showModal(ChangeDownloadUrlModal, {
      onConfirm: async url => {
        await tick();
        inputLabel = url;
        inputFile = url;
      },
    });
  };

  const handleBrowse = async () => {
    const electron = getElectron();
    const files = await electron.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'SQL Files', extensions: ['sql'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (files && files[0]) {
      const path = window.require('path');
      inputFile = files[0];
      inputLabel = path.parse(inputFile).name;
    }
  };

  async function handleFilesClick() {
    const rect = domButton.getBoundingClientRect();
    const left = rect.left;
    const top = rect.bottom;
    const files = await apiCall('files/list', { folder: 'sql' });
    const menu = files.map(({ file }) => ({
      label: file,
      onClick: async () => {
        inputFile = await apiCall('files/get-file-real-path', { folder: 'sql', file });
        if (inputFile) {
          inputLabel = file;
        }
      },
    }));
    currentDropDownMenu.set({ left, top, items: menu });
  }
</script>

<FormProvider>
  <ModalBase {...$$restProps}>
    <svelte:fragment slot="header">Import database dump</svelte:fragment>

    <div class="ml-3 mr-3 mt-3"><strong>Source:</strong> {inputLabel}</div>

    <div class="flex ml-3 mr-3 mb-3">
      {#if electron}
        <FormStyledButton type="button" value="Browse" on:click={handleBrowse} />
      {:else}
        <UploadButton />
      {/if}

      <FormStyledButton value="Web URL" on:click={handleAddUrl} />
      <FormStyledButton value="From files" on:click={handleFilesClick} bind:this={domButton} />
    </div>

    <div class="m-3">
      <strong>Target:</strong>
      {getConnectionLabel(connection)}
      {#if connection.database}
        ({connection.database})
      {/if}
    </div>

    <svelte:fragment slot="footer">
      <FormSubmit
        value="Run import"
        on:click={e => handleSubmit(e.detail)}
        disabled={!inputFile}
        data-testid="ImportDatabaseDumpModal_runImport"
      />
      <FormStyledButton
        type="button"
        value="Cancel"
        on:click={closeCurrentModal}
        data-testid="ImportDatabaseDumpModal_cancel"
      />
    </svelte:fragment>
  </ModalBase>
</FormProvider>
