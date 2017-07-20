import { Quill } from 'quill';

export type FilesHandler = (files: FileList, callback: (dataUrl: string) => void) => void;

export class ImageDrop {

    protected quill: Quill;
    protected filesHandler: FilesHandler | null = null;

    /**
     * Instantiate the module given a quill instance and any options
     * @param {Quill} quill
     * @param {Object} options
     */
    constructor(quill: Quill, options: { filesHandler?: FilesHandler } = {}) {
        // save the quill reference
        this.quill = quill;
        // bind handlers to this instance
        this.handleDrop = this.handleDrop.bind(this);
        this.handlePaste = this.handlePaste.bind(this);
        this.filesHandler = options.filesHandler || null;
        // listen for drop and paste events
        this.quill.root.addEventListener('drop', this.handleDrop, false);
        this.quill.root.addEventListener('paste', this.handlePaste, false);
    }

    /**
     * Handler for drop event to read dropped files from evt.dataTransfer
     * @param {DragEvent} evt
     */
    public handleDrop(evt: DragEvent): void {
        evt.preventDefault();
        if (evt.dataTransfer && evt.dataTransfer.files && evt.dataTransfer.files.length) {
            if (document.caretRangeFromPoint) {
                const selection = document.getSelection();
                const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
                if (selection && range) {
                    selection.setBaseAndExtent(
                        range.startContainer,
                        range.startOffset,
                        range.startContainer,
                        range.startOffset
                    );
                }
            }
            if (this.filesHandler !== null) {
                this.filesHandler(evt.dataTransfer.files, this.insert.bind(this));
            } else {
                this.readFiles(evt.dataTransfer.files, this.insert.bind(this));
            }
        }
    }

    /**
     * Handler for paste event to read pasted files from evt.clipboardData
     * @param {ClipboardEvent} evt
     */
    public handlePaste(evt: ClipboardEvent): void {
        evt.preventDefault();
        if (evt.clipboardData && evt.clipboardData.files && evt.clipboardData.files.length) {
            if (this.filesHandler !== null) {
                this.filesHandler(evt.clipboardData.files, this.insert.bind(this));
            } else {
                this.readFiles(evt.clipboardData.files, this.insert.bind(this));
            }
        }
    }

    /**
     * Insert the image into the document at the current cursor position
     * @param {String} dataUrl  The base64-encoded image URI or an URL
     */
    protected insert(dataUrl: string): void {
        const index = this.quill.getSelection().index || this.quill.getLength();
        this.quill.insertEmbed(index, 'image', dataUrl, 'user');
    }

    /**
     * Extract image URIs a list of files from evt.dataTransfer or evt.clipboardData
     * @param {FileList} files  One or more File objects
     * @param {Function} callback  A function to send each data URI to
     */
    protected readFiles(files: FileList | DataTransferItemList,
                        callback: (dataUrl: string) => any) {
        // check each file for an image
        [].forEach.call(files, (file: File | DataTransferItem) => {
            if (!file.type.match(/^image\/(gif|jpe?g|a?png|svg|webp|bmp|vnd\.microsoft\.icon)/i)) {
                // file is not an image
                // Note that some file formats such as psd start with image/* but are not readable
                return;
            }
            // set up file reader
            const reader = new FileReader();
            reader.onload = (evt: Event) => {
                callback((evt.target as FileReader).result);
            };
            // read the clipboard item or file
            const blob = file instanceof DataTransferItem ? file.getAsFile() : file;
            if (blob instanceof Blob) {
                reader.readAsDataURL(blob);
            }
        });
    }
}