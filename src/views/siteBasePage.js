var React = require('react');
import {sites} from '../config.js';
import {siteUrl} from '../urlUtil.js';

export const siteLangs = (siteSlug) => {
  let foundSite = sites.find(site => siteSlug === site.slug);
  return foundSite.langs;
};

var SiteLink = React.createClass({
  render: function() {
    return <div>
      <a href={siteUrl(this.props.siteSlug, this.props.lang)}>{this.props.lang}</a>
    </div>;
  }
});

var SitePerLangPage = React.createClass({
  render: function() {
    return <div>
    <h1>{this.props.title}</h1>
    {
      siteLangs(this.props.siteSlug).map(lang =>
        <SiteLink key={lang}
          lang={lang}
          siteSlug={this.props.siteSlug} />)
    }
    </div>;
  }
});

export default SitePerLangPage;
