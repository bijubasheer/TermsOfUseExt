import * as React from 'react';
import styles2 from './../my.module.scss';
import styles from './TermOfUseWp.module.scss';
import { ITermOfUseWpProps } from './ITermOfUseWpProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { sp, Version } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/site-users";
import { Button, ButtonType, Panel, Modal,IconButton, IIconProps, Stack, IStackTokens } from 'office-ui-fabric-react';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { _RoleDefinition } from '@pnp/sp/security/types';
import { Log } from '@microsoft/sp-core-library';

const LOG_SOURCE: string = 'TermsOfUseAppExtension';
var content = "";
var title = "";
var email = '';
var name = '';
var version = 0;
var dealer:string = "";
var dealerCode:string = "";

const termsListName = "Terms of Use List";
const acceptanceListName = "Terms of Use Acceptance List";

const stackTokens: IStackTokens = { childrenGap: 40 };
export interface ISidePanelState {
  isOpen?: boolean;
}

export interface IDialogcontrolState{  
  hideDialog: boolean;  
}  

export default class TermOfUseWp extends React.Component<ITermOfUseWpProps, IDialogcontrolState> {

  public constructor(props: ITermOfUseWpProps, state: ISidePanelState) {
    super(props, state);
    email = props.email;
    name = props.name;
    content = props.content;
    title = props.title;
    version = props.version;
    
    this.state = {  
      hideDialog: true
    };  
  }

  public render(): React.ReactElement<ITermOfUseWpProps> {    
    
    return (
      <>
      
     <div>
       
      <Modal  className={styles.termOfUseWp}
        titleAriaId={title}
        isOpen={this.state.hideDialog}  
        onDismiss={this._accept}
        isBlocking={true}        
      >
        <div className={styles.myModal}>
        
        <div dangerouslySetInnerHTML={{ __html: content}} className={styles.space}/>
        
        <div className={styles.center} >
          <Stack horizontal tokens={stackTokens}  className={styles.center}>
            <DefaultButton text="Accept" onClick={this._accept} allowDisabledFocus disabled={false}  />
            <PrimaryButton text="Reject" onClick={_reject} allowDisabledFocus disabled={false}  />
          </Stack>
          <div>
              <p></p></div>
        </div>
        </div>
      </Modal>
      </div>
    </>
    );
    
    function _reject(): void {      
      window.location.href = '/sites/DealerDaily';      
    }
  }

  
  private _showDialog = (): void => {  
    this.setState({ hideDialog: false });  
  }  
  private toggleHideDialog() {
    this.setState({
      hideDialog: !this.state.hideDialog
    });
  }
  private _accept = (): void => {      
    try
    {
      this.Update();
    }
    catch(e)
    {
      console.error(LOG_SOURCE, "Error adding acceptance list item. ", );
    }
    alert("Thanks for accpeting the Terms of Use.");
    this.setState({ hideDialog: false });  
  }  

  private async Update()
  {
    console.log(LOG_SOURCE,'Starting save...');
    let id:number = -1;
    let user = await sp.web.currentUser.get().then((u: any) => { 
      id = u["Id"];
    });
    
    //Un comment after changes to menu service
    //await this.GetDealerInfo();

    const newItem = await sp.web.lists.getByTitle(acceptanceListName).items.add({
      Title: version.toString(),
      TermsVersion: version,
      AcceptedById: id,
      Dealer:dealer,
      DealerCode: '00000' //dealerCode - //Change after changes to menu service
    });
  }

  private async GetDealerInfo()
  {
    let dealerInfo = document.getElementById('menu-context').children[0].children[0].children[0].innerHTML.trim();
    console.log("Dealer INfo = " + dealerInfo);
    if(dealerInfo !== "")
    {
      dealerCode = dealerInfo.split('|')[0].trim().split(':')[1].trim();
      dealer = dealerInfo.split('|')[1].trim();
    }
  }
}
