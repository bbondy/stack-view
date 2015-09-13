var React = require('react');
import {siteUrl, siteLangs} from '../siteUtil.js';

var SiteLink = React.createClass({
  render: function() {
    return <div>
      <a href={siteUrl(this.props.siteSlug, this.props.lang)}>{this.props.lang}</a>
    </div>;
  }
});

var SitePerLangPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
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
