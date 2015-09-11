var React = require('react');
import UserPage from './userPage.js';
import QuestionPage from './questionPage.js';
import TagPage from './tagPage.js';
import IndexPage from './indexPage.js';

var Main = React.createClass({
  render: function () {
    return <html>
      <head>
        <title>{this.props.title}</title>
        <link rel='stylesheet' href='/css/main.css'/>
        <link rel='stylesheet' href='/css/font-awesome/font-awesome.css'/>
        <script src='/js/analytics.js' async='async'/>
     </head>
     <body>
     { this.props.question ? <QuestionPage siteSlug={this.props.siteSlug}
       lang={this.props.lang}
       question={this.props.question}
       answers={this.props.answers}/> : null }
     { this.props.user ? <UserPage siteSlug={this.props.siteSlug}
       lang={this.props.lang}
       user={this.props.user}/> : null }
     { this.props.tags ? <TagPage siteSlug={this.props.siteSlug}
       lang={this.props.lang}
       tags={this.props.tags}/> : null }
     { !this.props.question && !this.props.user && !this.props.tags ? <IndexPage/> : null }

     </body>
   </html>;
  }
});
module.exports = Main;
