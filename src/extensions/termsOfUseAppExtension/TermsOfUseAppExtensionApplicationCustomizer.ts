import * as React from 'react';
import * as ReactDom from 'react-dom';
import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,  
  PlaceholderName  
} from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';
import { ITermOfUseWpProps } from './components/ITermOfUseWpProps';
import TermOfUseWp from './components/TermOfUseWp';
import * as strings from 'TermsOfUseAppExtensionApplicationCustomizerStrings';
import { sp } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";

const termsListName = "Terms of Use List";
const acceptanceListName = "Terms of Use Acceptance List";

const LOG_SOURCE: string = 'TermsOfUseAppExtensionApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface ITermsOfUseAppExtensionApplicationCustomizerProperties {
  // This is an example; replace with your own property
  testMessage: string;
  Top: string;  
  Bottom: string;  
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class TermsOfUseAppExtensionApplicationCustomizer
  extends BaseApplicationCustomizer<ITermsOfUseAppExtensionApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _bottomPlaceholder: PlaceholderContent | undefined;

  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    console.log(LOG_SOURCE + " : Initialized!");
    sp.setup({
      spfxContext: this.context
    });

    // Added to handle possible changes on the existence of placeholders.  
    this.context.placeholderProvider.changedEvent.add(this, this._renderPlaceHolders);  
      
    // Call render method for generating the HTML elements.  
    this._renderPlaceHolders();  

    let message: string = this.properties.testMessage;
    if (!message) {
      message = '(No properties were provided.)';
    }

    return Promise.resolve();
  }

  private _onDispose(): void {
    Log.info(LOG_SOURCE,'[TermsOfUseExtension._onDispose] Disposed custom top and bottom placeholders.');
  }
  private _renderPlaceHolders(): void {  
    Log.info(LOG_SOURCE, 'HelloWorldApplicationCustomizer._renderPlaceHolders()');  
    console.log('Available placeholders: ',  
    this.context.placeholderProvider.placeholderNames.map(name => PlaceholderName[name]).join(', '));  
      
    // Handling the bottom placeholder  
    if (!this._bottomPlaceholder) {  
      this._bottomPlaceholder =  
        this.context.placeholderProvider.tryCreateContent(  
          PlaceholderName.Bottom,  
          { onDispose: this._onDispose });  
      
      // The extension should not assume that the expected placeholder is available.  
      if (!this._bottomPlaceholder) {  
        console.error('The expected placeholder (Bottom) was not found.');  
        return;  
      }  
      
      if (this.properties) {  
        let bottomString: string = this.properties.Bottom;  
        if (!bottomString) {  
          bottomString = '(Bottom property was not defined.)';  
        }  
      
        if (this._bottomPlaceholder.domElement) {  

          let email:string = '';
          
          //Get latest version of terms
          console.log(LOG_SOURCE + " : Getting latest version of terms");

          sp.web.lists.getByTitle(termsListName).items
          .select("Title", "TermsofUseContent", "TermsVersion")
          .top(1)
          .orderBy("TermsVersion", false)
          .get()
          .then(items =>
          {
            console.log(LOG_SOURCE + " : Latest version of terms = " + items[0]["TermsVersion"]);
            let content = items[0]["TermsofUseContent"];
            let title = items[0]["Title"];
            let version = items[0]["TermsVersion"];
            let userId:number = -1;
            
            let user = sp.web.currentUser.get().then((u: any) => { 
              email = u.Email;
              let name = u.Title;
              userId = u.Id;

            //Check if record exists in Acceptance list
            Log.info(LOG_SOURCE, "Checking if record exists in Acceptance list");
            sp.web.lists.getByTitle(acceptanceListName).items
            .select("Title", "AcceptedBy/Title", "AcceptedBy/Id","AcceptedBy/EMail", "TermsVersion")
            .expand("AcceptedBy")
            .filter("TermsVersion eq " + version + " and " + "AcceptedBy eq " + userId)
            .get()
            .then(items =>
            {
              if(items.length == 0)
              {
                const element: React.ReactElement<ITermOfUseWpProps > = React.createElement(
                  TermOfUseWp,
                  {
                    email:email,
                    name:name,
                    content:content,
                    title :title,
                    version:version
                  }
                );
              
                ReactDom.render(element, this._bottomPlaceholder.domElement);
              }
            }).catch(error => {
              console.error(LOG_SOURCE, "Error checking if record exists in Acceptance list", error);
            });;
          });
          }).catch(error => {
            console.error(LOG_SOURCE, "Error fetching latest terms version", error);
          });
        }
      }
    }
  }
}
   
          
