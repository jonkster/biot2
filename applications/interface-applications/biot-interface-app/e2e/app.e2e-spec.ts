import { BiotInterfacePage } from './app.po';

describe('biot-interface App', () => {
  let page: BiotInterfacePage;

  beforeEach(() => {
    page = new BiotInterfacePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
