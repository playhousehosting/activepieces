import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/common';
import {
  AppConnectionWithoutSensitiveData,
  Chatbot,
  DataSource,
} from '@activepieces/shared';
import { ChatBotService } from '../chatbot.service';
import deepEqual from 'deep-equal';
import { PieceMetadata } from '@activepieces/pieces-framework';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ConnectionDropdownItem,
  appConnectionsActions,
} from '@activepieces/ui/feature-builder-store';
import { extractConnectionName } from '../utils';

@Component({
  selector: 'app-chatbot-settings',
  templateUrl: './chatbot-settings.component.html',
})
export class ChatbotSettingsComponent {
  formGroup: FormGroup<{
    displayName: FormControl<string>;
    prompt: FormControl<string>;
    connectionId: FormControl<string>;
    sources: FormControl<DataSource[]>;
  }>;
  saveConnection$: Observable<void>;
  connectionsDropdownList$: Observable<ConnectionDropdownItem[]>;
  connections$: Observable<AppConnectionWithoutSensitiveData[]>;
  chatbotId = '';
  readonly pieceName = '@activepieces/piece-openai';
  readonly pieceVersion = '0.3.0';
  readonly openAiPiece$: Observable<PieceMetadata>;
  updateSettings$: Observable<Chatbot> | undefined;
  loadConnections$: Observable<void>;
  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };
  saving = false;
  constructor(
    private formBuilder: FormBuilder,
    private chatbotService: ChatBotService,
    private pieceMetadaService: PieceMetadataService,
    private store: Store,
    private actRoute: ActivatedRoute
  ) {
    this.openAiPiece$ = this.pieceMetadaService.getPieceMetadata(
      this.pieceName,
      this.pieceVersion
    );
    this.formGroup = this.formBuilder.group({
      displayName: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      prompt: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      connectionId: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      sources: new FormControl<DataSource[]>([], {
        validators: [],
        nonNullable: true,
      }),
    });
    this.saveConnection$ =
      this.formGroup.controls.connectionId.valueChanges.pipe(
        tap(() => {
          this.save();
        }),
        map(() => void 0)
      );
    this.loadConnections$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData = value as {
          connections: AppConnectionWithoutSensitiveData[];
          chatbot: Chatbot;
        };
        this.formGroup.controls.connectionId.setValue(
          routeData.chatbot.connectionId
        );
        this.formGroup.controls.prompt.setValue(routeData.chatbot.prompt);
        this.formGroup.controls.displayName.setValue(
          routeData.chatbot.displayName
        );
        this.formGroup.controls.sources.setValue(routeData.chatbot.dataSources);
        this.chatbotId = routeData.chatbot.id;
        this.store.dispatch(
          appConnectionsActions.loadInitial({
            connections: routeData.connections,
          })
        );
      }),
      map(() => void 0)
    );
    this.connections$ = this.store.select(
      BuilderSelectors.selectAllAppConnections
    );
    this.connectionsDropdownList$ = this.store.select(
      BuilderSelectors.selectAppConnectionsDropdownOptionsWithIds
    );
  }
  connectionValueChanged(event: { value: string }) {
    const connectionName = extractConnectionName(event.value);
    this.formGroup.controls.connectionId.setValue(connectionName);
  }
  submit() {
    if (this.formGroup.valid && !this.saving) {
      this.save();
    }
    this.formGroup.markAllAsTouched();
  }

  save() {
    this.saving = true;
    this.updateSettings$ = this.chatbotService
      .update(this.chatbotId, {
        displayName: this.formGroup.controls.displayName.value,
        prompt: this.formGroup.controls.prompt.value,
        connectionId: this.formGroup.controls.connectionId.value,
      })
      .pipe(
        tap(() => {
          this.saving = false;
        })
      );
  }
}
