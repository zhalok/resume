import re

def escape_latex(text):
    """Escape special LaTeX characters."""
    special_chars = {'&': r'\&', '%': r'\%', '#': r'\#', '_': r'\_'}
    for char, escaped in special_chars.items():
        text = text.replace(char, escaped)
    return text

def apply_bold_markers(text):
    """Convert **text** markers to \\textbf{text} in LaTeX."""
    text = escape_latex(text)
    return re.sub(r'\*\*(.+?)\*\*', r'\\textbf{\1}', text)

def get_section_renderers(data, latex):
    """
    Returns a dictionary mapping section names to their render functions.

    Args:
        data: The resume data dictionary
        latex: The list to append LaTeX content to

    Returns:
        Dictionary mapping field names to render functions
    """

    def render_work():
        work = data.get("work", [])
        if work:
            latex.append(r"\section*{Experience}")
            for job in work:
                if "show" in job and job["show"] == False:
                    continue
                latex.append(
                    r"\textbf{%s} \hfill \textit{%s}\\"
                    % (job.get("name", ""), job.get("position", ""))
                )
                # Add location on the next line
                location = job.get("location", "")
                date_range = f"{job.get('startDate','')} -- {job.get('endDate','Present')}"
                if location:
                    latex.append(r"\textit{%s} \hfill \textit{%s}\\" % (location, date_range))
                else:
                    latex.append(r"\textit{%s}" % date_range)
                latex.append(r"\begin{itemize}")
                for hl in job.get("highlights", []):
                    latex.append(r"\item %s" % apply_bold_markers(hl))
                latex.append(r"\end{itemize}")
            latex.append(r"\vspace{2pt}")

    def render_skills():
        skills = data.get("skills", [])
        if skills:
            latex.append(r"\section*{Skills}")
            skill_list = [s.get("name", "") for s in skills if not ("show" in s and s["show"] == False)]
            latex.append(", ".join(skill_list))
            latex.append(r"\vspace{2pt}")

    def render_projects():
        projects = data.get("projects", [])
        if projects:
            latex.append(r"\section*{Projects}")
            for proj in projects:
                if "show" in proj and proj["show"] == False:
                    continue
                proj_name = proj.get("name", "")
                proj_url = proj.get("url", "")
                proj_stack = proj.get("stack","")
                proj_contributions = proj.get("contributions","")

                # Project name
                latex.append(r"\textbf{%s}\\" % proj_name)

                # if proj_desc:
                #     latex.append(r"\textit{%s}\\" % proj_desc)

                # Project URL if available
                if proj_url:
                    latex.append(r"\textit{%s}" % proj_url)

                if proj_contributions:
                        latex.append(r"\begin{itemize}")
                        for contribution in proj_contributions:
                            latex.append(r"\item %s" % apply_bold_markers(contribution))
                        latex.append(r"\end{itemize}")



                # Project stack if available
                if proj_stack:
                    stack_text = ", ".join([r"\small{%s}" % tech for tech in proj_stack])
                    latex.append(r"\small Tech: %s\\" % stack_text)


                # if idx != len(projects)-1:
                #     latex.append(r"\\")


            latex.append(r"\vspace{2pt}")

    def render_certificates():
        certifications = data.get("certificates", [])
        if certifications:
            latex.append(r"\section*{Certifications}")
            for cert in certifications:
                name = cert.get("name", "")
                issuer = cert.get("issuer", "")
                summary = cert.get("summary", "")
                url = cert.get("url", "")
                show = cert.get("show","")

                if show == False:
                    continue

                latex.append(r"\textbf{%s}\\" % name)
                if issuer:
                    latex.append(r"\small %s\\" % issuer)
                if url:
                    latex.append(r"\small %s\\" % url)
                if summary:
                    latex.append(r"\textit{%s}\\" % summary)

                # Add spacing after each certification
                # latex.append(r"\vspace{3pt}")

            latex.append(r"\vspace{2pt}")

    def render_education():
        edu = data.get("education", [])
        if edu:
            latex.append(r"\section*{Education}")
            for e in edu:
                if "show" in e and e["show"] == False:
                    continue
                latex.append(r"\textbf{%s}\\" % e.get("institution", ""))
                latex.append(r"%s in %s\\" % (e.get("studyType", ""), e.get("area", "")))
                latex.append(
                    r"\textit{%s -- %s}\\" % (e.get("startDate", ""), e.get("endDate", ""))
                )
            latex.append(r"\vspace{2pt}")

    def render_publications():
        publications = data.get("publications", [])
        if publications:
            latex.append(r"\section*{Publications}")
            for pub in publications:
                if "show" in pub and pub["show"] == False:
                    continue
                title = pub.get("name", "")
                publisher = pub.get("publisher", "")
                release_date = pub.get("releaseDate", "")
                url = pub.get("url", "")

                latex.append(r"\textbf{%s}\\" % escape_latex(title))
                if publisher:
                    latex.append(r"\small %s" % escape_latex(publisher))
                if release_date:
                    latex.append(r"\hfill \textit{%s}\\" % release_date)
                if url:
                    latex.append(r"\small \url{%s}\\" % url)
                contributions = pub.get("contributions", [])
                if contributions:
                    latex.append(r"\begin{itemize}")
                    for contribution in contributions:
                        latex.append(r"\item %s" % apply_bold_markers(contribution))
                    latex.append(r"\end{itemize}")
            latex.append(r"\vspace{2pt}")

    # Map field names to their render functions
    section_renderers = {
        "work": render_work,
        "skills": render_skills,
        "projects": render_projects,
        "certificates": render_certificates,
        "education": render_education,
        "publications": render_publications
    }

    return section_renderers
