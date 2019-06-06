import React from "react";
import { LocalFileSystemProxy } from "../../../../providers/storage/localFileSystemProxy";
import { strings } from "../../../../common/strings";

/**
 * Properties for Local Folder Picker
 * @member id - ID for HTML form control element
 * @member value - Initial value for picker
 * @member onChange - Function to call on change to selected value
 */
interface ILocalFileSystemPickerProps {
    id?: string;
    value: string;
    options: {
        isFilePicker: boolean;
    };
    onChange: (value) => void;
}

/**
 * State for Local Folder Picker
 * @member value - Selected folder
 */
interface ILocalFileSystemPickerState {
    value: string;
}

/**
 * @name - Local File System Picker
 * @description - Select file or folder from local file system
 */
export default class LocalFileSystemPicker extends React.Component<ILocalFileSystemPickerProps, ILocalFileSystemPickerState> {
    private localFileSystem: LocalFileSystemProxy;
    private fileSystemSelector: Function;
    private buttonLabel: string;
    static defaultProps = {
        options: {
            isFilePicker: false
        }
    }

    constructor(props, context) {
        super(props, context);

        this.state = {
            value: this.props.value || "",
        };

        this.localFileSystem = new LocalFileSystemProxy();
        if (this.props.options.isFilePicker) {
            this.fileSystemSelector = this.localFileSystem.selectFile;
            this.buttonLabel = strings.connections.providers.local.selectFile;
        }
        else {
            this.fileSystemSelector = this.localFileSystem.selectContainer;
            this.buttonLabel = strings.connections.providers.local.selectFolder;
        }
        this.selectFromFileSystem = this.selectFromFileSystem.bind(this);
    }

    public render() {
        const { id } = this.props;
        const { value } = this.state;

        return (
            <div className="input-group">
                <input id={id} type="text" className="form-control" value={value} readOnly={true} />
                <div className="input-group-append">
                    <button className="btn btn-primary"
                        type="button"
                        onClick={this.selectFromFileSystem}>{this.buttonLabel}
                    </button>
                </div>
            </div>
        );
    }

    public componentDidUpdate(prevProps) {
        if (prevProps.value !== this.props.value) {
            this.setState({
                value: this.props.value,
            });
        }
    }

    private selectFromFileSystem = async () => {
        const filePath = await this.fileSystemSelector();
        if (filePath) {
            this.setState({
                value: filePath,
            }, () => this.props.onChange(filePath));
        }
    }
}
