import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

projects = {
    'sem2': ('OOP Application (C++)', 'Apply Object-Oriented Programming principles to build a robust system.', 'Build an ATM System or Student Record Manager in C++'),
    'sem3': ('Static Website', 'Create your first front-end project to showcase your skills.', 'Build and host a Personal Portfolio (HTML/CSS/JS)'),
    'sem4': ('Dynamic Full-Stack App', 'Combine frontend and backend with a database to create a dynamic web app.', 'Build a To-Do App or Blog (MERN / Spring Boot / Django)'),
    'sem5': ('Complex System / API', 'Build a system with complex state management, authentication, or real-time features.', 'Build an E-commerce API or Real-time Chat App'),
    'sem6': ('AI / Cloud Integration', 'Integrate modern cloud services or AI APIs into your applications.', 'Add AI (OpenAI/Gemini) or Cloud (AWS/Firebase) to a project'),
    'sem7': ('Minor Capstone', 'Build a complete end-to-end system solving a real-world problem.', 'Build Minor Capstone with architecture documentation'),
    'sem8': ('Major Capstone & Deployment', 'Final year project with production-ready deployment.', 'Deploy Major Capstone to production and write thesis'),
}

for sem, data in projects.items():
    # We want to match up to the very last </div> of the semester-block
    # A semester-block ends with:
    # </div> (checklist-group)
    # </div> (subject-row)
    # </div> (subjects-container)
    # </div> (semester-block)
    
    # We will find the closing tags of subjects-container for each semester
    # And insert our project HTML before the closing div of subjects-container
    
    # regex matches: start of block, anything, then the end tags
    pattern = re.compile(r'(<div class="semester-block" data-sem="' + sem + r'".*?)(</div>\s*</div>\s*</div>)', re.DOTALL)
    
    html = f'''
                        <!-- PROJECT TRACK -->
                        <div class="subject-row project-row">
                            <div class="subject-info">
                                <div class="subject-header">
                                    <span class="subject-code project-code">PROJECT</span>
                                    <div class="subject-tags">
                                        <span class="tag-pill tag-project">Build Track</span>
                                    </div>
                                    <div class="subject-name">{data[0]}</div>
                                    <div class="subject-desc">{data[1]}</div>
                                </div>
                            </div>
                            <div class="checklist-group" data-group="{sem}-proj">
                                <label class="check-item"><input type="checkbox" class="check-input" data-id="p{sem[-1]}-1" onchange="updateAllProgress()"><span class="check-label">{data[2]}</span></label>
                            </div>
                        </div>'''
    
    def repl(m):
        # m.group(1) is up to the last inner div, we append our HTML, then close the container and block.
        # Wait, the regex matches `</div>\s*</div>\s*</div>`. Let's be precise.
        return m.group(1) + html + m.group(2)
        
    content = pattern.sub(repl, content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
