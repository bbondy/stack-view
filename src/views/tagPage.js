var React = require('react');

import Tag from './tag.js';

var TagPage = React.createClass({
  render: function() {
    return <div className='sectionContainer'>
      <h1>Tags</h1>
      {
        this.props.tags.map((tag) => <Tag key={tag.tagName} tag={tag} />)
      }
    </div>;
  }
});

export default TagPage;
