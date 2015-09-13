var React = require('react');
import {sites} from '../config.js';
import {siteUrl} from '../siteUtil.js';

var Site = React.createClass({
  render: function() {
    return <div>
      <a href={siteUrl(this.props.site.slug)}>{this.props.site.name}</a>
    </div>;
  }
});

var IndexPage = React.createClass({
  render: function() {
    return <div>
      { sites.map(site =>
        <Site site={site}/>)
      }
    </div>;
  }
});

export default IndexPage;
