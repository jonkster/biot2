import { BiotInterfaceAppPage } from './app.po';

describe('biot-interface-app App', () => {
  let page: BiotInterfaceAppPage;

  beforeEach(() => {
    page = new BiotInterfaceAppPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
